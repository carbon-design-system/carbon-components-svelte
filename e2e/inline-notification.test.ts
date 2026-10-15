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

  test.describe("fullWidth", () => {
    for (const [testId, width] of [
      ["notification-wide", 1200],
      ["notification-narrow", 240],
    ] as const) {
      test(`fills a ${width}px parent with no outer margin`, async ({
        page,
      }) => {
        const notification = page
          .getByTestId(testId)
          .locator(".bx--inline-notification");
        expect((await notification.boundingBox())?.width).toBe(width);
        await expect(notification).toHaveCSS("margin-top", "0px");
        await expect(notification).toHaveCSS("margin-bottom", "0px");
      });
    }

    test("keeps the default limits without it", async ({ page }) => {
      const notification = page
        .getByTestId("notification-default")
        .locator(".bx--inline-notification");
      expect((await notification.boundingBox())?.width).toBeLessThan(1200);
      await expect(notification).toHaveCSS("margin-top", "16px");
    });
  });
});
