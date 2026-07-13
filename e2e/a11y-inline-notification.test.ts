import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("InlineNotification a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/inline-notification.html");
    await expect(page.getByTestId("inline-notification")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
