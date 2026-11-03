import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

function toastWithText(page: Page, text: string) {
  return page.locator(".bx--toast-notification").filter({ hasText: text });
}

test.describe("NotificationQueue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notification-queue.html");
  });

  test("add shows a toast", async ({ page }) => {
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

  test("clear returns focus from a focused toast", async ({ page }) => {
    const add = page.getByTestId("nq-add");
    await add.click();
    await page.getByRole("button", { name: "Close notification" }).focus();
    await page.keyboard.press("Delete");
    await expect(page.locator(".bx--toast-notification")).toHaveCount(0);
    await expect(add).toBeFocused();
  });

  test("F6 reaches a toast's action without moving focus on open", async ({
    page,
  }) => {
    const add = page.getByTestId("nq-action");
    await add.click();
    const toast = toastWithText(page, "Report deleted");
    await expect(toast).toBeVisible();
    await expect(add).toBeFocused();

    // The action keeps the toast past its timeout.
    await page.waitForTimeout(800);
    await expect(toast).toBeVisible();

    await page.keyboard.press("F6");
    await expect(toast.getByRole("button", { name: "Undo" })).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toast).toHaveCount(0);
    await expect(page.getByTestId("nq-undone")).toHaveText("Undone");
    await expect(add).toBeFocused();
  });

  test("closing a toast moves focus to the next toast", async ({ page }) => {
    const origin = page.getByTestId("nq-t2");
    await page.getByTestId("nq-t1").click();
    await origin.click();
    const closeT1 = toastWithText(page, "T1").getByRole("button", {
      name: "Close notification",
    });
    const closeT2 = toastWithText(page, "T2").getByRole("button", {
      name: "Close notification",
    });

    await page.keyboard.press("F6");
    await expect(closeT2).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toastWithText(page, "T2")).toHaveCount(0);
    await expect(closeT1).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator(".bx--toast-notification")).toHaveCount(0);
    await expect(origin).toBeFocused();
  });

  test("Shift+F6 returns focus from the queue", async ({ page }) => {
    const add = page.getByTestId("nq-action");
    await add.click();
    await page.keyboard.press("F6");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();

    await page.keyboard.press("Shift+F6");
    await expect(add).toBeFocused();
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toBeVisible();
  });

  test("pauses timers while the pointer is in the queue", async ({ page }) => {
    await page.getByTestId("nq-slow").click();
    const toast = toastWithText(page, "Slow");
    await toast.hover();

    await page.waitForTimeout(1200);
    await expect(toast).toBeVisible();

    await page.mouse.move(1, 1);
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });

  test("pauses timers while focus is in the queue", async ({ page }) => {
    const add = page.getByTestId("nq-slow");
    await add.focus();
    await page.keyboard.press("Enter");
    const toast = toastWithText(page, "Slow");
    await page.keyboard.press("F6");
    await expect(
      toast.getByRole("button", { name: "Close notification" }),
    ).toBeFocused();

    await page.waitForTimeout(1200);
    await expect(toast).toBeVisible();

    await page.keyboard.press("Shift+F6");
    await expect(add).toBeFocused();
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });
});
