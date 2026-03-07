import { expect, test } from "@playwright/test";

test.describe("ToastNotification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toast-notification.html");
  });

  test("renders toast notification", async ({ page }) => {
    await expect(page.getByTestId("toast-notification")).toBeVisible();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Toast title")).toBeVisible();
    await expect(page.getByText("Toast subtitle")).toBeVisible();
  });

  test("can be dismissed via close button", async ({ page }) => {
    await expect(page.getByTestId("toast-notification")).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(page.getByTestId("toast-notification")).not.toBeVisible();
  });
});
