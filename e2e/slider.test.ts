import { expect, test } from "@playwright/test";

test.describe("Slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/slider.html");
  });

  test("renders with initial value", async ({ page }) => {
    await expect(page.getByTestId("value-display")).toHaveText("50");
  });

  test("renders slider component with thumb", async ({ page }) => {
    const slider = page.getByTestId("slider");
    await expect(slider).toBeVisible();
    await expect(slider.locator('[role="slider"]')).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  test("keyboard ArrowRight increases value", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("51");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("value-display")).toHaveText("52");
  });

  test("keyboard ArrowLeft decreases value", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("value-display")).toHaveText("49");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("value-display")).toHaveText("48");
  });

  test("keyboard with Shift uses step multiplier", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("Shift+ArrowRight");
    // step=1, range=100, stepMultiplier=4 -> delta = 100/4 = 25
    await expect(page.getByTestId("value-display")).toHaveText("75");
  });

  test("keyboard cannot move the value past max", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    // Shift+ArrowRight adds 25 per press; from 50 three presses would land
    // at 125 without clamping against max (100).
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("100");
    await expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });
});
