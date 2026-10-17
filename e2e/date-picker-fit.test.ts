import { expect, test } from "./helpers/host";

/**
 * Single and range pickers fit a container narrower than their fixed
 * widths (288px, 2 x 143.5px), and keep those widths where there's room.
 */
test("date pickers fit a narrow container", async ({ page }) => {
  await page.goto("/date-picker-fit.html");

  for (const id of ["single-200", "range-200", "single-260", "range-260"]) {
    const box = page.getByTestId(id);
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const outer = await box.boundingBox();
    const inputs = await box
      .locator(".bx--date-picker__input")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
    expect.soft(outer && inputs.length, `${id} rendered`).toBeTruthy();
    if (!outer) continue;
    for (const right of inputs) {
      expect
        .soft(right, `${id} input inside`)
        .toBeLessThanOrEqual(outer.x + outer.width + 0.5);
    }
  }

  const wide = await page
    .getByTestId("single-wide")
    .locator(".bx--date-picker__input")
    .boundingBox();
  expect(wide?.width).toBeCloseTo(288, 0);
});
