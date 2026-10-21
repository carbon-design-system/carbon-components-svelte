import { expect, test } from "./helpers/host";

/**
 * Pagination lays out by its own width: in a container narrower than md
 * it shows only the item count and the page buttons, as on a small
 * screen, and its buttons stay inside the container.
 */
test("pagination fits its container", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/pagination-fit.html");

  for (const width of [200, 320, 480, 800]) {
    const box = page.getByTestId(`pagination-${width}`);
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const outer = await box.boundingBox();
    const next = await box
      .locator(".bx--pagination__button--forward")
      .boundingBox();
    expect.soft(outer && next, `${width} rendered`).toBeTruthy();
    if (!outer || !next) continue;
    expect
      .soft(next.x + next.width, `${width}px: next-page button inside`)
      .toBeLessThanOrEqual(outer.x + outer.width + 0.5);
  }

  // Wider than md, the page-size select shows again.
  await expect(
    page.getByTestId("pagination-800").locator(".bx--select").first(),
  ).toBeVisible();
  await expect(
    page.getByTestId("pagination-480").locator(".bx--select").first(),
  ).toBeHidden();
});

/**
 * A skeleton follows the same layout: narrow, a bar for the item count and
 * one for the page buttons, rather than none.
 */
test("pagination skeleton shows the narrow layout's bars", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/pagination-fit.html");

  const visibleBars = (width: number) =>
    page
      .getByTestId(`skeleton-${width}`)
      .locator(".bx--skeleton__text")
      .evaluateAll(
        (bars) =>
          bars.filter((bar) => bar.getBoundingClientRect().width > 0).length,
      );
  expect(await visibleBars(320)).toBe(2);
  expect(await visibleBars(800)).toBe(4);
});
