import { expect, test } from "@playwright/test";

test.describe("RangeSlider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/range-slider.html");
  });

  test("renders with initial values", async ({ page }) => {
    await expect(page.getByTestId("value-display")).toHaveText("20");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("renders both thumbs with correct aria-valuenow", async ({ page }) => {
    const slider = page.getByTestId("range-slider");
    await expect(slider).toBeVisible();
    const thumbs = slider.locator('[role="slider"]');
    await expect(thumbs).toHaveCount(2);
    await expect(thumbs.nth(0)).toHaveAttribute("aria-valuenow", "20");
    await expect(thumbs.nth(1)).toHaveAttribute("aria-valuenow", "80");
  });

  test("ArrowRight on lower thumb increases the lower bound", async ({
    page,
  }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("21");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("ArrowLeft on upper thumb decreases the upper bound", async ({
    page,
  }) => {
    const upper = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(1);
    await upper.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("value-upper-display")).toHaveText("79");
    await expect(page.getByTestId("value-display")).toHaveText("20");
  });

  test("Shift+arrow uses step multiplier", async ({ page }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    await page.keyboard.press("Shift+ArrowRight");
    // step=1, range=100, stepMultiplier=4 -> delta = 100/4 = 25 -> 20 + 25 = 45
    await expect(page.getByTestId("value-display")).toHaveText("45");
  });

  test("lower thumb cannot move past upper thumb", async ({ page }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    // Try to push well past the upper bound (80) using Shift+ArrowRight which
    // adds 25 per press. After 3 presses we'd be at 95 without clamping.
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("80");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("upper thumb cannot move below lower thumb", async ({ page }) => {
    const upper = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(1);
    await upper.focus();
    // Shift+ArrowLeft adds -25 per press; three presses would land at 5
    // without clamping against the lower bound (20).
    await page.keyboard.press("Shift+ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(page.getByTestId("value-upper-display")).toHaveText("20");
    await expect(page.getByTestId("value-display")).toHaveText("20");
  });
});
