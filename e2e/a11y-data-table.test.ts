import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("DataTable a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/data-table.html");
    await expect(page.getByTestId("data-table-basic")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    const sortTable = page.getByTestId("data-table-sort");
    await sortTable.getByRole("button", { name: /Name/ }).click();
    await expect(
      sortTable.locator("th[aria-sort]").filter({ hasText: "Name" }),
    ).toHaveAttribute("aria-sort", "ascending");

    const sortedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(sortedResults.violations).toEqual([]);

    const expandTable = page.getByTestId("data-table-expand");
    await expandTable
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();
    await expect(page.getByTestId("expanded-detail").first()).toBeVisible();

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });
});
