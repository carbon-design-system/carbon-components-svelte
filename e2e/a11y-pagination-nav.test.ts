import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("PaginationNav a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/pagination-nav.html");
    await expect(page.getByTestId("pagination-nav")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after navigating to a page", async ({
    page,
  }) => {
    await page.goto("/pagination-nav.html");
    await page.locator('button[data-page="3"]').click();
    await expect(page.locator('button[data-page="3"]')).toHaveAttribute(
      "aria-current",
      "page",
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
