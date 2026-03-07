import { expect, test } from "@playwright/test";

test.describe("ComposedModal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/composed-modal.html");
  });

  test("does not show content when closed", async ({ page }) => {
    const modal = page.locator(".bx--modal");
    await expect(modal).not.toHaveClass(/is-visible/);
  });

  test("shows content when opened", async ({ page }) => {
    await page.getByTestId("open-modal").click();

    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
    await expect(page.getByTestId("modal-body")).toHaveText("Modal content");
  });

  test("closes when close button is clicked", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);

    await page.getByTestId("close-modal").click();
    await expect(page.locator(".bx--modal")).not.toHaveClass(/is-visible/);
  });
});
