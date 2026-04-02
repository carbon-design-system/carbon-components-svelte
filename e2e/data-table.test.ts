import { expect, test } from "@playwright/test";

test.describe("DataTable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table.html");
  });

  test("renders table with headers", async ({ page }) => {
    const basic = page.getByTestId("data-table-basic");
    await expect(
      basic.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      basic.getByRole("columnheader", { name: "Value" }),
    ).toBeVisible();
  });

  test("renders rows with data", async ({ page }) => {
    const basic = page.getByTestId("data-table-basic");
    await expect(basic.locator(".bx--data-table")).toBeVisible();
    await expect(
      basic.getByRole("cell", { name: "Row 0", exact: true }),
    ).toBeVisible();
    await expect(
      basic.getByRole("cell", { name: "Row 1", exact: true }),
    ).toBeVisible();
  });

  test("sortable: clicking Name header sorts rows ascending", async ({
    page,
  }) => {
    const sort = page.getByTestId("data-table-sort");
    await sort
      .getByRole("button", {
        name: /Sort rows by this header in ascending order/,
      })
      .first()
      .click();

    const firstRow = sort.locator("tbody tr").first();
    await expect(firstRow).toContainText("Alpha");
    await expect(sort.locator("tbody tr").nth(1)).toContainText("Mike");
    await expect(sort.locator("tbody tr").nth(2)).toContainText("Zebra");
  });

  test("expandable: expand button reveals slot content", async ({ page }) => {
    const expand = page.getByTestId("data-table-expand");
    await expand
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();
    await expect(expand.getByTestId("expanded-detail")).toHaveText(
      "Extra row: First",
    );
  });

  test("batch selection: select all checks every row", async ({ page }) => {
    const batch = page.getByTestId("data-table-batch");
    await batch
      .getByRole("checkbox", { name: "Select all rows" })
      .click({ force: true });

    const selectedRows = batch.locator("tbody tr.bx--data-table--selected");
    await expect(selectedRows).toHaveCount(2);
  });
});
