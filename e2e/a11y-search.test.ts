import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Search a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/search.html");
    await expect(page.getByTestId("search-query")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("search-query").fill("carbon");
    await expect(
      page.getByRole("button", { name: "Clear search input" }),
    ).toBeVisible();

    const withValueResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(withValueResults.violations).toEqual([]);

    await page.getByTestId("search-expandable").focus();
    await expect(page.getByTestId("search-expandable")).toBeFocused();

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });
});
