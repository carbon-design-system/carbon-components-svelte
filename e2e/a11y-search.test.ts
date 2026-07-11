import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Search a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/search.html");
    await expect(page.getByTestId("search-query")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a value and the clear button visible", async ({
    page,
  }) => {
    await page.goto("/search.html");
    await page.getByTestId("search-query").fill("carbon");
    await expect(
      page.getByRole("button", { name: "Clear search input" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations when expanded", async ({
    page,
  }) => {
    await page.goto("/search.html");
    await page.getByTestId("search-expandable").focus();
    await expect(page.getByTestId("search-expandable")).toBeFocused();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
