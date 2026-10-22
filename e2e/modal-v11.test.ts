import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function openModal(page: Page) {
  await page.goto("/modal-v11.html");
  await page.getByTestId("open-modal").click();
  await expect(page.getByTestId("modal")).toHaveClass(/is-visible/);
}

test.describe("Modal loadingStatus", () => {
  test("shows each status in the primary button", async ({ page }) => {
    await openModal(page);
    const footer = page.locator('[data-testid="modal"] .bx--modal-footer');
    const primary = footer.locator(".bx--btn--primary");
    const cancel = footer.getByRole("button", { name: "Cancel" });

    await expect(primary).toHaveText("Save");
    await expect(footer).not.toHaveAttribute("aria-busy");

    await page.getByTestId("status-active").click();
    await expect(primary.locator(".bx--loading")).toBeVisible();
    await expect(primary).toBeDisabled();
    await expect(cancel).toBeDisabled();
    await expect(footer).toHaveAttribute("aria-busy", "true");

    await page.getByTestId("status-error").click();
    await expect(primary.locator(".bx--inline-loading--error")).toBeVisible();
    await expect(footer).not.toHaveAttribute("aria-busy");

    await page.getByTestId("status-finished").click();
    await expect(
      primary.locator(".bx--inline-loading__checkmark-container"),
    ).toBeVisible();
    await expect(page.getByTestId("success-count")).toHaveText("1", {
      timeout: 4000,
    });

    await page.getByTestId("status-inactive").click();
    await expect(primary).toHaveText("Save");
    await expect(primary).toBeEnabled();
  });

  test("sets aria-busy on the ComposedModal footer", async ({ page }) => {
    await page.goto("/modal-v11.html");
    await page.getByTestId("open-composed-modal").click();
    const footer = page.locator(
      '[data-testid="composed-modal"] .bx--modal-footer',
    );

    await expect(footer).toHaveAttribute("aria-busy", "true");
    await expect(
      footer.locator(".bx--btn--primary .bx--loading"),
    ).toBeVisible();
  });
});
