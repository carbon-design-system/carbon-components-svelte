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
});
