import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Pagination a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/pagination.html");
    await expect(page.getByTestId("pagination")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
