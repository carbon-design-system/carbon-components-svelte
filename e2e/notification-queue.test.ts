import { expect, type Page, test } from "@playwright/test";

function toastWithText(page: Page, text: string) {
  return page.locator(".bx--toast-notification").filter({ hasText: text });
}

test.describe("NotificationQueue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notification-queue.html");
  });

  test("add shows a toast alert", async ({ page }) => {
    await page.getByTestId("nq-add").click();
    await expect(toastWithText(page, "Toast A")).toBeVisible();
  });

  test("respects maxNotifications by dropping oldest (top-right)", async ({
    page,
  }) => {
    await page.getByTestId("nq-t1").click();
    await page.getByTestId("nq-t2").click();
    await page.getByTestId("nq-t3").click();

    await expect(toastWithText(page, "T1")).toHaveCount(0);
    await expect(page.locator(".bx--toast-notification")).toHaveCount(2);
    await expect(toastWithText(page, "T3")).toBeVisible();
    await expect(toastWithText(page, "T2")).toBeVisible();
  });

  test("toast with timeout is removed after delay", async ({ page }) => {
    await page.getByTestId("nq-timed").click();
    await expect(toastWithText(page, "Quick")).toBeVisible();
    await expect(toastWithText(page, "Quick")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("close button removes toast", async ({ page }) => {
    await page.getByTestId("nq-add").click();
    const toast = toastWithText(page, "Toast A");
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "Close notification" }).click();
    await expect(toast).toHaveCount(0);
  });
});
