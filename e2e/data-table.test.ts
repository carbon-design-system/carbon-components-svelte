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

  test("expandable: expanded content has block padding, not flush against row edges", async ({
    page,
  }) => {
    const expand = page.getByTestId("data-table-expand");
    await expand
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();

    const container = expand.locator(".bx--child-row-inner-container").first();
    await expect(container).toHaveCSS("padding-top", "16px");
    await expect(container).toHaveCSS("padding-bottom", "24px");
  });

  test("expandable: with a checkbox column, expanded content aligns under the row's own text", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-expand-selectable");
    await table
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();

    const nameCell = table.locator("tr.bx--parent-row td").nth(2);
    const detail = table.getByTestId("expand-selectable-detail");

    const [nameBox, detailBox] = await Promise.all([
      nameCell.boundingBox(),
      detail.boundingBox(),
    ]);
    const namePaddingLeft = await nameCell.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).paddingLeft),
    );

    expect(detailBox.x).toBeCloseTo(nameBox.x + namePaddingLeft, 0);
  });

  test("expandable: supports row ids matching object prototype properties", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-prototype-id");
    const detail = table.getByTestId("prototype-id-detail");

    await expect(table).toBeVisible();
    await expect(detail).toBeHidden();

    await table.getByRole("button", { name: "Expand current row" }).click();
    await expect(detail).toHaveText("Extra row: Prototype ID");

    await table.getByRole("button", { name: "Collapse current row" }).click();
    await expect(detail).toBeHidden();
  });

  test("batch selection: select all checks every row", async ({ page }) => {
    const batch = page.getByTestId("data-table-batch");
    await batch
      .getByRole("checkbox", { name: "Select all rows" })
      .click({ force: true });

    const selectedRows = batch.locator("tbody tr.bx--data-table--selected");
    await expect(selectedRows).toHaveCount(2);
  });

  test("selectable: shift+click selects the row range", async ({ page }) => {
    const table = page.getByTestId("data-table-select-range");
    const checkboxes = table.getByRole("checkbox", { name: "Select row" });

    await checkboxes.nth(0).click({ force: true });
    await checkboxes.nth(2).click({ force: true, modifiers: ["Shift"] });

    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
    await expect(checkboxes.nth(2)).toBeChecked();
  });
});
