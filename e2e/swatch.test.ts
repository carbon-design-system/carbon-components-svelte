import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const dotsOf = (page: Page, testId: string) =>
  page.getByTestId(testId).locator(".bx--swatch");

test.describe("Swatch", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/swatch.html");
    await expect(dotsOf(page, "palette")).toHaveCount(8);

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("names a labelled swatch and hides the others", async ({ page }) => {
    await page.goto("/swatch.html");

    await expect(page.getByRole("img", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(2);
    await expect(dotsOf(page, "palette").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  for (const theme of ["white", "g100"]) {
    test(`paints a dot that differs from its tag in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/swatch.html");
      await page.evaluate(
        (t) => document.documentElement.setAttribute("theme", t),
        theme,
      );

      const pairs = await page
        .locator(".bx--tag .bx--swatch")
        .evaluateAll((dots) =>
          dots.map((dot) => {
            const tag = dot.closest(".bx--tag");
            return [
              getComputedStyle(dot).backgroundColor,
              tag ? getComputedStyle(tag).backgroundColor : "",
            ];
          }),
        );
      expect(pairs.length).toBeGreaterThan(10);
      for (const [dot, tag] of pairs) expect(dot).not.toBe(tag);
    });
  }

  test("centers the dot in the tag's icon box at each size", async ({
    page,
  }) => {
    await page.goto("/swatch.html");

    const offsets = await page
      .getByTestId("sizes")
      .locator(".bx--tag__custom-icon")
      .evaluateAll((boxes) =>
        boxes.map((box) => {
          const b = box.getBoundingClientRect();
          const d = (box.firstElementChild as Element).getBoundingClientRect();
          return [
            d.left - b.left - (b.right - d.right),
            d.top - b.top - (b.bottom - d.bottom),
          ];
        }),
      );
    for (const [x, y] of offsets) {
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1);
    }
  });

  test("puts the dot at the inline start of its label in RTL", async ({
    page,
  }) => {
    await page.goto("/swatch.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const tag = page.getByTestId("hashed").locator(".bx--tag").first();
    const dot = await tag.locator(".bx--swatch").boundingBox();
    const label = await tag.locator(".bx--tag__label").boundingBox();
    expect(dot && label && dot.x > label.x).toBe(true);
  });

  test("keeps the same space beside the icon in RTL as in LTR", async ({
    page,
  }) => {
    await page.goto("/swatch.html");
    const tag = page.getByTestId("hashed").locator(".bx--tag").first();
    // Distance from the inline start edge to the dot, and from the label to
    // the inline end edge.
    const gaps = () =>
      tag.evaluate((el) => {
        const rtl = getComputedStyle(el).direction === "rtl";
        const box = el.getBoundingClientRect();
        const dot = el.querySelector(".bx--swatch")?.getBoundingClientRect();
        const label = el
          .querySelector(".bx--tag__label")
          ?.getBoundingClientRect();
        if (!dot || !label) throw new Error("no dot or label");
        return rtl
          ? [box.right - dot.right, label.left - box.left]
          : [dot.left - box.left, box.right - label.right];
      });

    const ltr = await gaps();
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    expect(await gaps()).toEqual(ltr);
  });

  test("keeps the dot's fill and rings it in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/swatch.html");

    const style = await dotsOf(page, "palette")
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        const probe = document.createElement("div");
        probe.style.color = "CanvasText";
        document.body.append(probe);
        const canvasText = getComputedStyle(probe).color;
        probe.remove();
        return {
          adjust: s.forcedColorAdjust,
          border: s.borderTopColor,
          borderWidth: s.borderTopWidth,
          fill: s.backgroundColor,
          canvasText,
        };
      });
    expect(style.adjust).toBe("none");
    expect(style.border).toBe(style.canvasText);
    expect(style.borderWidth).toBe("1px");
    expect(style.fill).not.toBe("rgba(0, 0, 0, 0)");
  });
});
