import { expect, test } from "@playwright/test";

test.describe("InlineNotification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inline-notification.html");
  });

  test("renders notification", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Notification title")).toBeVisible();
    await expect(page.getByText("Notification subtitle")).toBeVisible();
  });

  test("can be dismissed via close button", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(page.getByTestId("inline-notification")).not.toBeVisible();
  });
});
