import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("DataTable a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/data-table.html");
    await expect(page.getByTestId("data-table-basic")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after sorting a column", async ({
    page,
  }) => {
    await page.goto("/data-table.html");
    const sortTable = page.getByTestId("data-table-sort");
    await sortTable.getByRole("button", { name: /Name/ }).click();
    await expect(
      sortTable.locator("th[aria-sort]").filter({ hasText: "Name" }),
    ).toHaveAttribute("aria-sort", "ascending");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a row expanded", async ({
    page,
  }) => {
    await page.goto("/data-table.html");
    const expandTable = page.getByTestId("data-table-expand");
    await expandTable
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();
    await expect(page.getByTestId("expanded-detail").first()).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
