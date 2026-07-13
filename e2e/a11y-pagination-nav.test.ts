import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("PaginationNav a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/pagination-nav.html");
    await expect(page.getByTestId("pagination-nav")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.locator('button[data-page="3"]').click();
    await expect(page.locator('button[data-page="3"]')).toHaveAttribute(
      "aria-current",
      "page",
    );

    const navigatedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(navigatedResults.violations).toEqual([]);
  });
});
