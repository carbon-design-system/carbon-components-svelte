import { expect, test } from "./helpers/host";

/**
 * A set grows tall when it holds a secondary label, read in CSS with
 * `:has()`. Each tab renders from its own props, so this layout is also
 * the server's first paint. Every tab is as tall as the tallest, and
 * every label sits on the same line at the tab's start edge.
 */
const layout = (page, testId: string) =>
  page
    .getByTestId(testId)
    .locator(".bx--tabs__nav-item")
    .evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        const label = item
          .querySelector(".bx--tabs__nav-item-label")
          ?.getBoundingClientRect();
        const secondary = item
          .querySelector(".bx--tabs__nav-item-secondary-label")
          ?.getBoundingClientRect();
        return {
          height: Math.round(box.height),
          labelTop: Math.round((label?.top ?? 0) - box.top),
          labelLeft: Math.round((label?.left ?? 0) - box.left),
          labelWidth: Math.round(label?.width ?? 0),
          secondaryTop: secondary
            ? Math.round(secondary.top - box.top)
            : undefined,
          secondaryLeft: secondary
            ? Math.round(secondary.left - box.left)
            : undefined,
        };
      }),
    );

test("container tabs with a secondary label share one height and label line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tabs-tall.html");
  for (const size of ["default", "sm", "xl"]) {
    const tabs = await layout(page, `tabs-${size}`);
    expect
      .soft(new Set(tabs.map((t) => t.height)), size)
      .toEqual(new Set([64]));
    expect
      .soft(new Set(tabs.map((t) => t.labelTop)).size, `${size} label line`)
      .toBe(1);
    expect.soft(tabs[1].secondaryLeft, size).toBe(tabs[1].labelLeft);
  }
});

test("a vertical tab stacks its secondary label under its label", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tabs-tall.html");
  const [overview, alerts] = await layout(page, "vertical");

  expect(overview.labelWidth).toBeGreaterThan(0);
  expect(alerts.labelWidth).toBeGreaterThan(0);
  expect(alerts.secondaryLeft).toBe(alerts.labelLeft);
  expect(alerts.secondaryTop).toBeGreaterThan(alerts.labelTop);
});
