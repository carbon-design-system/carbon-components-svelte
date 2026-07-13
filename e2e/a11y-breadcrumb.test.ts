import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Breadcrumb a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/breadcrumb.html");
    await expect(page.getByTestId("breadcrumb")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
