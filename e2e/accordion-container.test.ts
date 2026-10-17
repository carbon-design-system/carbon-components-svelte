import { expect, test } from "./helpers/host";

/**
 * An accordion's content takes its right padding from the accordion's own
 * width, not the window's: 16px under 480px, 48px from 480px, and a
 * quarter of the width from 640px.
 */
test("accordion content padding follows the accordion's width", async ({
  page,
}) => {
  // An xlg window, wider than every box.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/accordion-container.html");

  const padding = (testid: string) =>
    page
      .getByTestId(testid)
      .locator(".bx--accordion__content")
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingRight));

  expect(await padding("box-320")).toBe(16);
  expect(await padding("box-500")).toBe(48);
  expect(await padding("box-900")).toBeCloseTo(225, 0);

  // A parent that sizes to its content doesn't collapse the accordion.
  for (const testid of ["flex-row", "inline-block"]) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one parent at a time
    const box = await page
      .getByTestId(testid)
      .locator(".bx--accordion")
      .boundingBox();
    expect.soft(box?.width, testid).toBeGreaterThan(100);
  }
});
