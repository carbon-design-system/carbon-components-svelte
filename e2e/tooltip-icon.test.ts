import { expect, test } from "@playwright/test";

test.describe("TooltipIcon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-icon.html");
  });

  test("renders tooltip icon", async ({ page }) => {
    await expect(page.getByTestId("tooltip-icon")).toBeVisible();
  });

  test("shows tooltip on focus", async ({ page }) => {
    await page.getByTestId("tooltip-icon").focus();

    await expect(page.getByText("Icon tooltip text")).toBeAttached();
  });

  test("shows tooltip on hover", async ({ page }) => {
    await page.getByTestId("tooltip-icon").hover();

    await expect(page.getByText("Icon tooltip text")).toBeAttached();
  });
});
