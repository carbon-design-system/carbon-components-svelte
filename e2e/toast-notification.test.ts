import { expect, test } from "./helpers/host";

test.describe("ToastNotification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toast-notification.html");
  });

  test("renders toast notification", async ({ page }) => {
    await expect(page.getByTestId("toast-notification")).toBeVisible();
    const notification = page.getByTestId("toast-notification");
    await expect(notification).toHaveRole("status");
    // Named once, by role="img" and <title>, so it isn't read twice.
    const icon = notification.getByRole("img", { name: "Success" });
    await expect(icon).toBeVisible();
    await expect(icon).not.toHaveAttribute("aria-label");
    await expect(page.getByText("Toast title")).toBeVisible();
    await expect(page.getByText("Toast subtitle")).toBeVisible();
  });

  test("can be dismissed via close button", async ({ page }) => {
    await expect(page.getByTestId("toast-notification")).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(page.getByTestId("toast-notification")).not.toBeVisible();
  });
});
