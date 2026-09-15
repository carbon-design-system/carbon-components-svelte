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

  test("expandable: a nested DataTable in the expandedRow slot gets its own background, unlike plain content", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-expand-nested-table");
    await table
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();

    const container = table.locator(".bx--child-row-inner-container").first();
    const nestedContainer = container.locator(".bx--data-table-container");

    const [containerBg, nestedBg] = await Promise.all([
      container.evaluate((el) => getComputedStyle(el).backgroundColor),
      nestedContainer.evaluate((el) => getComputedStyle(el).backgroundColor),
    ]);

    // The generic child-row wrapper stays transparent (plain expandedRow
    // content, like the "block padding" example above, keeps the parent
    // row's background). Only the nested table's own container gets a
    // distinct background so it does not blend into the parent row.
    expect(containerBg).toBe("rgba(0, 0, 0, 0)");
    expect(nestedBg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("expandable: a nested DataTable's own header and body cells keep their own backgrounds", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-expand-nested-table");
    await table
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();

    const nestedContainer = table
      .locator(".bx--child-row-inner-container .bx--data-table-container")
      .first();

    // Regression: `.bx--data-table tbody th` and similar unscoped
    // descendant selectors match the nested table's cells too, since a
    // nested table sits inside the parent table's own tbody. That
    // misapplied the tbody-row-header token to the nested table's column
    // headers, making them match its body cells instead of standing out,
    // and gave them a stray border-top/border-bottom meant for tbody
    // row-header cells, showing as a thin line above the header row.
    const th = nestedContainer.locator("thead th").first();
    const td = nestedContainer.locator("tbody td").first();
    const [theadBg, tdBg, thBorderTop] = await Promise.all([
      th.evaluate((el) => getComputedStyle(el).backgroundColor),
      td.evaluate((el) => getComputedStyle(el).backgroundColor),
      th.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ]);
    expect(theadBg).not.toBe(tdBg);
    expect(thBorderTop).toBe("0px");

    // Regression: the parent row's own indent
    // (`padding-left: 3.5rem` on `tr[data-child-row] td`) also uses a bare
    // `td` descendant selector, which reaches the nested table's own body
    // cells and pushed them out of alignment with its own header.
    const [thX, tdX] = await Promise.all([
      th.evaluate((el) => el.getBoundingClientRect().x),
      td.evaluate((el) => el.getBoundingClientRect().x),
    ]);
    expect(tdX).toBeCloseTo(thX, 0);
  });

  test("expandable: hovering the parent row does not bleed into a nested DataTable's background", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-expand-nested-table");
    await table
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();

    const nestedTd = table
      .locator(
        ".bx--child-row-inner-container .bx--data-table-container tbody td",
      )
      .first();
    const nestedRow = table
      .locator(
        ".bx--child-row-inner-container .bx--data-table-container tbody tr",
      )
      .first();
    const outerRow = table.locator("tr.bx--parent-row").first();

    const restingBg = await nestedTd.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    // Regression: the parent row's `:hover` rule for its sibling child row
    // uses a bare `td` descendant selector, which matches the nested
    // table's cells too and swapped them to the parent row's hover color,
    // even though the nested table's own rows were not hovered.
    await outerRow.hover();
    await expect(nestedTd).toHaveCSS("background-color", restingBg);

    // The nested table's own row hover still works normally.
    await nestedRow.hover();
    await expect(nestedTd).not.toHaveCSS("background-color", restingBg);
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

  test("radio: allowDeselect clears the selection when clicking the already-selected row's label", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-radio-deselect");
    const firstRowLabel = table
      .locator('tr[data-row="q1"] label.bx--radio-button__label')
      .first();
    const firstRowRadio = table.locator(
      'tr[data-row="q1"] input[type="radio"]',
    );

    // A real (unforced) click goes through the visible label, which the
    // browser re-dispatches onto the hidden input. That is the path a real
    // user takes and force-clicking the input directly does not exercise.
    await expect(firstRowRadio).toBeChecked();
    await firstRowLabel.click();

    await expect(firstRowRadio).not.toBeChecked();
    await expect(table.locator('input[type="radio"]:checked')).toHaveCount(0);
  });

  test("radio: clicking a different row's label still selects it", async ({
    page,
  }) => {
    const table = page.getByTestId("data-table-radio-deselect");
    const secondRowLabel = table
      .locator('tr[data-row="q2"] label.bx--radio-button__label')
      .first();
    const secondRowRadio = table.locator(
      'tr[data-row="q2"] input[type="radio"]',
    );
    const firstRowRadio = table.locator(
      'tr[data-row="q1"] input[type="radio"]',
    );

    await secondRowLabel.click();

    await expect(secondRowRadio).toBeChecked();
    await expect(firstRowRadio).not.toBeChecked();
  });
});
