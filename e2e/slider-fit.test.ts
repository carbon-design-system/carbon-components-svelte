import { expect, test } from "./helpers/host";

/**
 * Sliders fit a container narrower than their 200px track plus labels
 * and number inputs, keep the 200px track where there's room, and still
 * fill the row with fullWidth.
 */
test("sliders fit their container", async ({ page }) => {
  await page.goto("/slider-fit.html");

  const fits = [
    "slider-200",
    "slider-320",
    "range-320",
    "slider-600",
    "range-600",
  ];
  for (const id of fits) {
    const box = page.getByTestId(id);
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const right = await box.evaluate((el) => {
      const edge = el.getBoundingClientRect().right;
      return Math.max(
        ...[...el.querySelectorAll(".bx--slider-container *")].map(
          (child) => child.getBoundingClientRect().right - edge,
        ),
      );
    });
    expect.soft(right, `${id} stays inside`).toBeLessThanOrEqual(0.5);
  }

  const track = (id: string) =>
    page.getByTestId(id).locator(".bx--slider").boundingBox();
  expect((await track("slider-600"))?.width).toBeCloseTo(200, 0);
  expect((await track("full-600"))?.width).toBeGreaterThan(400);
});
