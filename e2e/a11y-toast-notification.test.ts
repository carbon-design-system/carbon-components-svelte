import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ToastNotification a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/toast-notification.html");
    await expect(page.getByTestId("toast-notification")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
