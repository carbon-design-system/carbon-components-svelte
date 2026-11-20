import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";
import {
  drift,
  DRIFT_ACROSS,
  DRIFT_DOWN,
  frames,
  routeFontsAway,
  worst,
} from "./helpers/input-layer";

// TokenSearch (#5388) drew its qualifiers on a layer of its own, and measured
// that layer against a Search in three browsers. This is that layer on
// `createInputLayer`, held to the same cases and the same thresholds.

const LATIN = 'is:open label:bug "an exact phrase" author:ada free words';
const HEBREW = 'שלום עולם is:open label:bug "ביטוי מדויק" שוב';
const LONG =
  'is:open label:bug,ui author:@me -label:wontfix created:>=2026-01-01 comments:3..10 title:"a long title here" "an exact phrase" free words that go on and on and on until the field must scroll sideways is:closed label:"good first issue" more free text to push the caret past the end ';
const HEBREW_LONG = `שלום עולם is:open label:bug ${"מילים נוספות בעברית ועוד ".repeat(14)}label:"good first issue" סוף`;

const cases: Array<{
  name: string;
  text: string;
  dir?: "rtl";
  typed?: boolean;
}> = [
  { name: "short Latin, LTR", text: LATIN },
  { name: "short Hebrew first, LTR", text: HEBREW },
  { name: "short Latin, RTL", text: LATIN, dir: "rtl" },
  { name: "short Hebrew, RTL", text: HEBREW, dir: "rtl" },
  { name: "long Latin, typed, scrolled, LTR", text: LONG, typed: true },
  { name: "long Hebrew, typed, scrolled, LTR", text: HEBREW_LONG, typed: true },
  {
    name: "long Latin, typed, scrolled, RTL",
    text: LONG,
    dir: "rtl",
    typed: true,
  },
  {
    name: "long Hebrew, typed, scrolled, RTL",
    text: HEBREW_LONG,
    dir: "rtl",
    typed: true,
  },
];

test.describe("TokenSearch's layer on createInputLayer", () => {
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
    await page.goto("/token-search-port.html");
    await page.getByTestId("port-search").waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  for (const c of cases) {
    test(c.name, async ({ page }, info) => {
      const input = page.getByTestId("port-search");
      await page.evaluate((dir) => {
        document.documentElement.dir = dir ?? "ltr";
      }, c.dir);
      await input.fill("");
      await input.focus();
      if (c.typed) await page.keyboard.type(c.text);
      else await input.fill(c.text);
      await frames(page);
      // The icons are the same with and without the layer.
      const result = worst(
        await drift(page, "port", { box: ".bx--search", margin: 44 }),
      );
      info.annotations.push({
        type: "drift",
        description: `TokenSearch port, ${c.name}: ${result.dx.toFixed(2)} across, ${result.dy.toFixed(2)} down, ${result.thirds} thirds`,
      });
      expect(result.thirds).toBeGreaterThan(0);
      expect(result.dx).toBeLessThan(DRIFT_ACROSS);
      expect(result.dy).toBeLessThan(DRIFT_DOWN);
    });
  }

  test("the qualifiers are drawn behind the text, and the field keeps its fill", async ({
    page,
  }) => {
    const input = page.getByTestId("port-search");
    await input.fill(LATIN);
    await frames(page);
    await expect(page.locator("#port .port-qualifier")).toHaveCount(6);
    const read = await page.evaluate(() => {
      const field = document.querySelector(
        "[data-testid=port-search]",
      ) as HTMLElement;
      const layer = document.querySelector(
        "#port .bx--input-layer",
      ) as HTMLElement;
      return {
        fieldFill: getComputedStyle(field).backgroundColor,
        layerFill: getComputedStyle(layer).backgroundColor,
        layerZ: getComputedStyle(layer).zIndex,
        pointer: getComputedStyle(layer).pointerEvents,
        hidden: layer.getAttribute("aria-hidden"),
        icon: document.querySelector("#port .bx--search-magnifier")
          ? getComputedStyle(
              document.querySelector("#port .bx--search-magnifier") as Element,
            ).zIndex
          : null,
      };
    });
    expect(read.fieldFill).toBe("rgba(0, 0, 0, 0)");
    expect(read.layerFill).not.toBe("rgba(0, 0, 0, 0)");
    expect(read.layerZ).toBe("-1");
    expect(read.pointer).toBe("none");
    expect(read.hidden).toBe("true");
  });

  test("a value set from code is drawn, and clearing the field clears the layer", async ({
    page,
  }) => {
    await page.getByTestId("port-search").fill("is:open");
    await expect(page.locator("#port .port-qualifier")).toHaveCount(2);
    await page.getByRole("button", { name: "Clear search input" }).click();
    await expect(page.getByTestId("port-search")).toHaveValue("");
    await expect(page.locator("#port .port-qualifier")).toHaveCount(0);
  });

  test("axe, in Gray 100 and RTL", async ({ page }) => {
    await page.getByTestId("port-search").fill(LATIN);
    for (const [theme, dir] of [
      ["g100", "ltr"],
      ["white", "rtl"],
    ] as const) {
      await page.evaluate(
        ([theme, dir]) => {
          document.documentElement.classList.toggle(
            "bx--g100",
            theme === "g100",
          );
          document.documentElement.dir = dir;
        },
        [theme, dir] as const,
      );
      await page.waitForTimeout(250);
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations, `${theme} ${dir}`).toEqual([]);
    }
    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.dir = "ltr";
    });
  });
});
