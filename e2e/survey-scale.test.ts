import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectNoPageOverflow } from "./helpers/layout";

const options = (scale: Locator) => scale.locator(".bx--survey-scale__content");

const boxes = (scale: Locator) =>
  options(scale).evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );

const checkedIndex = (scale: Locator) =>
  scale
    .getByRole("radio")
    .evaluateAll((radios) =>
      radios.findIndex((radio) => (radio as HTMLInputElement).checked),
    );

test.describe("SurveyScale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/survey-scale.html");
    await page.evaluate(() => document.fonts.ready);
  });

  test("moves with the arrow keys and leaves the scale with Tab", async ({
    page,
  }) => {
    const nps = page.getByTestId("nps");
    // WebKit on macOS doesn't tab to radios by default.
    await nps.getByRole("radio").first().focus();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(page.getByTestId("nps-value")).toHaveText("3");
    expect(await checkedIndex(nps)).toBe(3);

    // One tab stop for the whole scale: Tab leaves it for the next control.
    await page.keyboard.press("Tab");
    await expect(nps.locator(":focus")).toHaveCount(0);
  });

  test("draws the focus ring on the option, not the hidden radio", async ({
    page,
  }) => {
    const nps = page.getByTestId("nps");
    await nps.getByRole("radio").nth(5).focus();

    const outline = await options(nps)
      .nth(5)
      .evaluate((node) => getComputedStyle(node).outlineStyle);
    expect(outline).toBe("solid");
  });

  test("lays the 11 NPS options out in one row on a wide screen", async ({
    page,
  }) => {
    const nps = page.getByTestId("nps");
    const rects = await boxes(nps);

    expect(new Set(rects.map((rect) => rect.y)).size).toBe(1);
    expect(Math.min(...rects.map((rect) => rect.width))).toBeGreaterThanOrEqual(
      44,
    );
    // The ends sit below the row, one at each side.
    const ends = await nps
      .locator(".bx--survey-scale__end")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().y),
      );
    expect(ends[0]).toBeGreaterThan(rects[0].y);
    expect(ends[0]).toBe(ends[1]);
  });

  test("wraps the 11 NPS options onto two rows at 320px, each a 44px target", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const nps = page.getByTestId("nps");
    const rects = await boxes(nps);

    const rows = [...new Set(rects.map((rect) => rect.y))];
    expect(rows).toHaveLength(2);
    expect(rects.filter((rect) => rect.y === rows[0])).toHaveLength(6);
    for (const rect of rects) {
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    // Low end above the first row, high end below the last.
    const [min, max] = await nps
      .locator(".bx--survey-scale__end")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().y),
      );
    expect(min).toBeLessThan(rows[0]);
    expect(max).toBeGreaterThan(rows[1]);
    await expectNoPageOverflow(page);
  });

  test("stacks labeled options into a list at 320px and rows when wide", async ({
    page,
  }) => {
    const wide = await boxes(page.getByTestId("likert7"));
    expect(new Set(wide.map((rect) => rect.y)).size).toBe(1);

    await page.setViewportSize({ width: 320, height: 720 });
    const narrow = await boxes(page.getByTestId("likert7"));

    expect(new Set(narrow.map((rect) => rect.y)).size).toBe(7);
    expect(new Set(narrow.map((rect) => rect.x)).size).toBe(1);
    await expectNoPageOverflow(page);
  });

  test("keeps the scale ascending in reading order under RTL", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const scale = page.getByTestId("likert7");
    const rects = await boxes(scale);

    // The lowest point starts at the right.
    expect(rects[0].x).toBeGreaterThan(rects[6].x);

    await scale.getByRole("radio").nth(2).focus();
    // ArrowLeft points toward the inline end in RTL, in every engine.
    await page.keyboard.press("ArrowLeft");
    expect(await checkedIndex(scale)).toBe(3);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await checkedIndex(scale)).toBe(1);
  });

  test("shows the chosen option with a fill, a border and a check in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const scale = page.getByTestId("likert");
    const [chosen, other] = await Promise.all([
      scale.locator(".bx--survey-scale__content").nth(3),
      scale.locator(".bx--survey-scale__content").nth(0),
    ]).then((nodes) =>
      Promise.all(
        nodes.map((node) =>
          node.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              background: style.backgroundColor,
              border: style.borderTopColor,
              color: style.color,
              check: !!element.querySelector(".bx--survey-scale__check"),
            };
          }),
        ),
      ),
    );

    expect(chosen.check).toBe(true);
    expect(other.check).toBe(false);
    expect(chosen.background).not.toBe(other.background);
    expect(chosen.border).not.toBe(other.border);
    expect(chosen.color).not.toBe(chosen.background);
  });

  test("keeps a CSAT face an outline in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const fills = await page
      .getByTestId("csat")
      .locator(
        ".bx--survey-scale__face > circle:first-child, .bx--survey-scale__face > path",
      )
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));

    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills)).toEqual(new Set(["none"]));
  });

  test("names the group and describes what its ends mean", async ({ page }) => {
    await expect(page.getByTestId("nps")).toMatchAriaSnapshot(`
      - radiogroup "How likely are you to recommend us to a friend?":
        - radio "0"
        - radio "1"
        - radio "2"
        - radio "3"
        - radio "4"
        - radio "5"
        - radio "6"
        - radio "7"
        - radio "8"
        - radio "9"
        - radio "10"
    `);
    const group = page.getByTestId("nps").getByRole("radiogroup");
    await expect(group).toHaveAccessibleDescription(
      "0 is Not at all likely, 10 is Extremely likely",
    );
    await expect(
      page.getByTestId("nps").getByRole("radio", { name: "0", exact: true }),
    ).toHaveAccessibleDescription("Not at all likely");
  });

  test("resets with its form", async ({ page }) => {
    const nps = page.getByTestId("nps");
    await nps.locator(".bx--survey-scale__content").nth(8).click();
    await expect(page.getByTestId("nps-value")).toHaveText("8");

    await page.getByTestId("reset").click();

    await expect(page.getByTestId("nps-value")).toHaveText("none");
    expect(await checkedIndex(nps)).toBe(-1);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await page
      .getByTestId("csat")
      .locator(".bx--survey-scale__content")
      .nth(1)
      .click();
    const chosen = await new AxeBuilder({ page }).include("#app").analyze();
    expect(chosen.violations).toEqual([]);
  });
});

test("has no accessibility violations in Gray 100", async ({ page }) => {
  await page.goto("/survey-scale.html");
  // A theme switch fades the options, and axe would read a color mid-fade.
  await page.addStyleTag({ content: "*{transition:none!important}" });
  await page.evaluate(() => document.documentElement.classList.add("bx--g100"));

  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
});
