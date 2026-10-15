import { expect, type Page, test } from "@playwright/test";

/** How far the row's marker sits from the end of the form item before it. */
function gapBeforeMarker(page: Page, testId: string): Promise<number> {
  const row = page.getByTestId(testId);
  return row.evaluate((node) => {
    const item = node.querySelector(".bx--form-item");
    const marker = node.querySelector("[data-marker]");
    if (!item || !marker) return Number.NaN;
    return (
      marker.getBoundingClientRect().left - item.getBoundingClientRect().right
    );
  });
}

/** How much of the 600px row the form item takes. */
function itemWidth(page: Page, testId: string): Promise<number> {
  return page
    .getByTestId(testId)
    .locator(".bx--form-item")
    .first()
    .evaluate((node) => node.getBoundingClientRect().width);
}

test.describe("Form item width in a flex row", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/form-item-fit.html");
  });

  for (const testId of [
    "row-toggle",
    "row-checkbox",
    "row-time-picker",
    "row-date-picker",
    "row-slider",
  ]) {
    test(`${testId}: a fixed-size control keeps its width`, async ({
      page,
    }) => {
      expect(await gapBeforeMarker(page, testId)).toBe(16);
      expect(await itemWidth(page, testId)).toBeLessThan(450);
    });
  }

  for (const testId of ["row-text-input", "row-slider-full-width"]) {
    test(`${testId}: a field that fills still grows`, async ({ page }) => {
      expect(await itemWidth(page, testId)).toBeGreaterThan(450);
    });
  }
});
