import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("NotificationQueue a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/notification-queue.html");
    await expect(page.getByTestId("notification-queue-root")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a toast visible", async ({
    page,
  }) => {
    await page.goto("/notification-queue.html");
    await page.getByTestId("nq-add").click();
    await expect(page.getByText("Toast A")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
