import { expect, test } from "@playwright/test";

test.describe("Tooltip", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip.html");
  });

  test("does not show content when open is false", async ({ page }) => {
    await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
  });

  test("shows content when open is true", async ({ page }) => {
    await page.getByTestId("toggle").click();

    await expect(page.getByTestId("tooltip-content")).toBeVisible();
    await expect(page.getByTestId("tooltip-content")).toHaveText(
      "Tooltip content",
    );
  });

  test("hides when toggle is clicked again", async ({ page }) => {
    await page.getByTestId("toggle").click();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();

    await page.getByTestId("toggle").click();
    await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
  });

  test("shows on hover after enter delay", async ({ page }) => {
    await page.getByTestId("tooltip-wrapper").hover();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();
  });

  test("shows on focus", async ({ page }) => {
    const trigger = page.getByTestId("tooltip-wrapper").getByRole("button");
    await trigger.focus();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();
  });
});
