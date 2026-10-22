import { expect, test } from "./helpers/host";

test.describe("InlineNotification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inline-notification.html");
  });

  test("renders notification", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    const notification = page.getByTestId("inline-notification");
    await expect(notification).toHaveRole("status");
    // Named once, by role="img" and <title>, so it isn't read twice.
    const icon = notification.getByRole("img", { name: "Information" });
    await expect(icon).toBeVisible();
    await expect(icon).not.toHaveAttribute("aria-label");
    await expect(page.getByText("Notification title")).toBeVisible();
    await expect(page.getByText("Notification subtitle")).toBeVisible();
  });

  test("can be dismissed via close button", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(page.getByTestId("inline-notification")).not.toBeVisible();
  });

  test("fills a wide parent with fullWidth, with no outer margin", async ({
    page,
  }) => {
    const notification = page
      .getByTestId("notification-wide")
      .locator(".bx--inline-notification");
    expect((await notification.boundingBox())?.width).toBe(1200);
    await expect(notification).toHaveCSS("margin-top", "0px");
    await expect(notification).toHaveCSS("margin-bottom", "0px");
  });
});
