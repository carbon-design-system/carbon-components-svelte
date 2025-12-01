import { render, screen, within } from "@testing-library/svelte";
import type DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DataTable from "./DataTable.test.svelte";
import DataTableCustomBoth from "./DataTableCustomBoth.test.svelte";
import DataTableCustomDescription from "./DataTableCustomDescription.test.svelte";
import DataTableCustomSlots from "./DataTableCustomSlots.test.svelte";

describe("DataTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ] as const;

  const rows = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  // Basic rendering and structure tests
  it("renders with default props", () => {
    render(DataTable);
    // Check if table headers are rendered
    for (const header of headers) {
      expect(screen.getByText(header.value)).toBeInTheDocument();
    }

    // Check if table has correct structure
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass("bx--data-table");

    // Check if table has correct number of rows
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(tableRows).toHaveLength(3);

    // Check if all rows contain the expected data
    for (const row of rows) {
      const rowElement = screen.getByText(row.name).closest("tr");
      expect(rowElement).toBeInTheDocument();
      assert(rowElement);

      const cells = within(rowElement).getAllByRole("cell");
      expect(cells.length).toBe(4);

      const protocolCell = Array.from(cells).find(
        (cell) => cell.textContent?.trim() === row.protocol,
      );
      expect(protocolCell).toBeInTheDocument();

      const portCell = Array.from(cells).find(
        (cell) => cell.textContent?.trim() === row.port.toString(),
      );
      expect(portCell).toBeInTheDocument();

      const ruleCell = Array.from(cells).find(
        (cell) => cell.textContent?.trim() === row.rule,
      );
      expect(ruleCell).toBeInTheDocument();
    }
  });

  it("renders with title and description", () => {
    render(DataTable, {
      props: {
        title: "Test Table",
        description: "Test Description",
        headers,
        rows,
      },
    });

    expect(
      screen.getByRole("heading", { name: "Test Table" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("handles empty table state", () => {
    render(DataTable, {
      props: {
        headers,
        rows: [],
      },
    });

    const table = screen.getByRole("table");
    const tableBody = table.querySelector("tbody");
    assert(tableBody);
    expect(tableBody.children.length).toBe(0);
  });

  it("handles table with only one column", () => {
    const singleColumnHeaders = [{ key: "name", value: "Name" }];

    render(DataTable, {
      props: {
        headers: singleColumnHeaders,
        rows: rows.map(({ id, name }) => ({ id, name })),
      },
    });

    const columns = screen.getAllByRole("columnheader");
    expect(columns.length).toBe(1);
    expect(columns[0]).toHaveTextContent("Name");
  });

  it("handles table with very long content", () => {
    const longContentRows = [
      {
        id: "a",
        name: "A very long name that should be truncated or wrapped in the table cell",
        protocol: "HTTP",
        port: 3000,
        rule: "Round robin",
      },
    ];

    render(DataTable, {
      props: {
        headers,
        rows: longContentRows,
      },
    });

    const table = screen.getByRole("table");
    const longCell = within(table).getByRole("cell", {
      name: /very long name/i,
    });
    expect(longCell).toBeInTheDocument();
  });

  // Sorting tests
  it("handles sorting functionality", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    // Get all header cells
    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells.length).toBe(4);

    // Test sorting by name (ascending)
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    // Verify rows are sorted by name ascending
    const rowsAfterNameSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRowName = within(rowsAfterNameSort[0]).getByRole("cell", {
      name: "Load Balancer 1",
    });
    expect(firstRowName).toHaveTextContent("Load Balancer 1");

    // Test sorting by name (descending)
    await user.click(nameHeader);
    const rowsAfterNameDescSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRowNameDesc = within(rowsAfterNameDescSort[0]).getByRole(
      "cell",
      {
        name: "Load Balancer 3",
      },
    );
    expect(firstRowNameDesc).toHaveTextContent("Load Balancer 3");

    // Test sorting by port (ascending)
    const portHeader = screen.getByText("Port");
    await user.click(portHeader);

    // Verify rows are sorted by port ascending
    const rowsAfterPortSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRowPort = within(rowsAfterPortSort[0]).getAllByRole("cell")[2];
    expect(firstRowPort).toHaveTextContent("80");

    // Test sorting by port (descending)
    await user.click(portHeader);
    const rowsAfterPortDescSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRowPortDesc = within(rowsAfterPortDescSort[0]).getAllByRole(
      "cell",
    )[2];
    expect(firstRowPortDesc).toHaveTextContent("3000");
  });

  it("handles sorting with custom display and sort methods", async () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      {
        key: "cost",
        value: "Cost",
        display: (cost: string | number | boolean) => `${cost} €`,
      },
      {
        key: "expireDate",
        value: "Expire date",
        display: (date: string | number | boolean) =>
          new Date(date as string).toLocaleString(),
        sort: (a: string | number | boolean, b: string | number | boolean) =>
          new Date(a as string).getTime() - new Date(b as string).getTime(),
      },
    ];

    const customRows = [
      {
        id: "a",
        name: "Load Balancer 1",
        cost: 100,
        expireDate: "2024-01-01",
      },
      {
        id: "b",
        name: "Load Balancer 2",
        cost: 200,
        expireDate: "2023-12-31",
      },
      {
        id: "c",
        name: "Load Balancer 3",
        cost: 150,
        expireDate: "2024-02-01",
      },
    ];

    render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows: customRows,
      },
    });

    // Verify custom display formatting
    const _table = screen.getByRole("table");
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const costCells = tableRows.map(
      (row) => within(row).getAllByRole("cell")[1],
    );
    expect(costCells[0]).toHaveTextContent("100 €");
    expect(costCells[1]).toHaveTextContent("200 €");

    // Test sorting by expireDate
    const dateHeader = screen.getByText("Expire date");
    await user.click(dateHeader);

    // Verify rows are sorted by date ascending
    const rowsAfterDateSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(
      within(rowsAfterDateSort[0]).getByRole("cell", {
        name: "Load Balancer 2",
      }),
    ).toHaveTextContent("Load Balancer 2");
    expect(
      within(rowsAfterDateSort[2]).getByRole("cell", {
        name: "Load Balancer 3",
      }),
    ).toHaveTextContent("Load Balancer 3");
  });

  it("handles sorting with nested object values", async () => {
    const nestedHeaders = [
      { key: "name", value: "Name" },
      { key: "network.protocol", value: "Protocol" },
      { key: "network.port", value: "Port" },
    ] as const;

    const nestedRows = [
      {
        id: "a",
        name: "Load Balancer 1",
        network: { protocol: "HTTP", port: 3000 },
      },
      {
        id: "b",
        name: "Load Balancer 2",
        network: { protocol: "HTTPS", port: 443 },
      },
      {
        id: "c",
        name: "Load Balancer 3",
        network: { protocol: "HTTP", port: 80 },
      },
    ];

    render(DataTable, {
      props: {
        sortable: true,
        headers: nestedHeaders,
        rows: nestedRows,
      },
    });

    // Test sorting by nested port value
    const portHeader = screen.getByText("Port");
    await user.click(portHeader);

    // Verify rows are sorted by port ascending
    const rowsAfterPortSort = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(
      within(rowsAfterPortSort[0]).getAllByRole("cell")[2],
    ).toHaveTextContent("80");
    expect(
      within(rowsAfterPortSort[1]).getAllByRole("cell")[2],
    ).toHaveTextContent("443");
    expect(
      within(rowsAfterPortSort[2]).getAllByRole("cell")[2],
    ).toHaveTextContent("3000");
  });

  it("handles disabled sorting on specific columns", async () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", sort: false as const },
      { key: "port", value: "Port" },
    ];

    render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows,
      },
    });

    const protocolHeader = screen.getByText("Protocol");
    await user.click(protocolHeader);

    // Verify no sorting occurred
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRow = tableRows[0];
    expect(
      within(firstRow).getByRole("cell", { name: "Load Balancer 3" }),
    ).toHaveTextContent("Load Balancer 3");
  });

  it("handles table with numeric sorting", async () => {
    const numericRows = [
      { id: "a", value: 10 },
      { id: "b", value: 2 },
      { id: "c", value: 20 },
    ];

    const numericHeaders = [{ key: "value", value: "Value" }];

    render(DataTable, {
      props: {
        sortable: true,
        headers: numericHeaders,
        rows: numericRows,
      },
    });

    const valueHeader = screen.getByText("Value");
    await user.click(valueHeader);

    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const sortedCells = tableRows.map((row) => within(row).getByRole("cell"));
    expect(sortedCells[0]).toHaveTextContent("2");
    expect(sortedCells[1]).toHaveTextContent("10");
    expect(sortedCells[2]).toHaveTextContent("20");
  });

  // Selection tests
  it("handles selectable rows", async () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        headers,
        rows,
      },
    });

    // Verify checkboxes are present in each row
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(3);

    // Select first row
    await user.click(checkboxes[0]);

    // Verify row is selected
    const selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).toBeInTheDocument();
  });

  it("handles batch selection", async () => {
    const { container } = render(DataTable, {
      props: {
        batchSelection: true,
        headers,
        rows,
      },
    });

    // Verify batch selection checkbox is present
    const batchCheckbox = screen.getByRole("checkbox", {
      name: /select all/i,
    });

    // Click batch selection checkbox
    await user.click(batchCheckbox);

    // Verify all rows are selected
    const selectedRows = container.querySelectorAll(
      ".bx--data-table--selected",
    );
    expect(selectedRows.length).toBe(3);

    // Click batch selection checkbox again
    await user.click(batchCheckbox);

    // Verify no rows are selected
    const unselectedRows = container.querySelectorAll(
      ".bx--data-table--selected",
    );
    expect(unselectedRows.length).toBe(0);
  });

  it("handles radio selection", async () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        radio: true,
        headers,
        rows,
      },
    });

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons.length).toBe(3);

    await user.click(radioButtons[0]);
    const selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).toBeInTheDocument();
  });

  it("handles non-selectable and non-expandable rows", () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        nonSelectableRowIds: ["b"],
        nonExpandableRowIds: ["c"],
        headers,
        rows,
      },
    });

    // Verify non-selectable row doesn't have a checkbox
    const nonSelectableRow = container.querySelector("tr[data-row='b']");
    assert(nonSelectableRow instanceof HTMLTableRowElement);
    const nonSelectableCheckbox =
      within(nonSelectableRow).queryByRole("checkbox");
    expect(nonSelectableCheckbox).not.toBeInTheDocument();

    // Verify non-expandable row doesn't have an expand button
    const nonExpandableRow = container.querySelector("tr[data-row='c']");
    assert(nonExpandableRow instanceof HTMLTableRowElement);
    const nonExpandableButton = within(nonExpandableRow).queryByRole("button", {
      name: /expand/i,
    });
    expect(nonExpandableButton).not.toBeInTheDocument();
  });

  // Expandable rows tests
  it("handles expandable rows", async () => {
    const { container } = render(DataTable, {
      props: {
        expandable: true,
        headers,
        rows,
      },
    });

    // Verify expand button is present in each row
    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons.length).toBe(3);

    // Click expand button on first row
    await user.click(expandButtons[0]);

    const expandedRow = container.querySelector(".bx--expandable-row");
    expect(expandedRow).toBeInTheDocument();
    expect(expandedRow).toHaveClass("bx--expandable-row bx--parent-row");
  });

  it("handles batch expansion", async () => {
    const { container } = render(DataTable, {
      props: {
        expandable: true,
        batchExpansion: true,
        headers,
        rows,
      },
    });

    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(0);

    const expandAllButton = screen.getByLabelText("Expand all rows");

    await user.click(expandAllButton);
    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(3);

    await user.click(expandAllButton);
    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(0);
  });

  // Styling and layout tests
  it("applies zebra stripe styling", () => {
    render(DataTable, {
      props: {
        zebra: true,
        headers,
        rows,
      },
    });

    // Verify zebra stripe classes are applied
    const table = screen.getByRole("table");
    expect(table).toHaveClass("bx--data-table--zebra");
  });

  it("applies different size variants", () => {
    type Size = "compact" | "short" | "medium" | "tall";
    const sizeMappings: Record<Size, string> = {
      compact: "bx--data-table--compact",
      short: "bx--data-table--short",
      medium: "bx--data-table--md",
      tall: "bx--data-table--tall",
    };

    for (const [size, expectedClass] of Object.entries(sizeMappings)) {
      const { unmount } = render(DataTable, {
        props: {
          size: size as Size,
          headers,
          rows,
        },
      });

      // Verify size class is applied
      const table = screen.getByRole("table");
      expect(table).toHaveClass(expectedClass);
      unmount();
    }
  });

  it("applies custom column widths", () => {
    const customHeaders = [
      { key: "name", value: "Name", width: "200px" },
      { key: "protocol", value: "Protocol", minWidth: "100px" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
    ] as const;

    render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
      },
    });

    // Verify table has fixed layout
    const table = screen.getByRole("table");
    expect(table).toHaveStyle({ "table-layout": "fixed" });

    // Verify name column has correct width
    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(nameHeader).toHaveStyle({ width: "200px" });

    // Verify protocol column has correct min-width
    const protocolHeader = screen.getByRole("columnheader", {
      name: "Protocol",
    });
    expect(protocolHeader).toHaveStyle({ "min-width": "100px" });
  });

  it("applies sticky header", () => {
    render(DataTable, {
      props: {
        stickyHeader: true,
        headers,
        rows,
      },
    });

    const table = screen.getByRole("table");
    expect(table).toHaveClass("bx--data-table--sticky-header");
  });

  it("handles static width", () => {
    const { container } = render(DataTable, {
      props: {
        useStaticWidth: true,
        headers,
        rows,
      },
    });

    const tableContainer = container.querySelector(".bx--data-table-container");
    expect(tableContainer).toHaveClass("bx--data-table-container--static");

    const table = screen.getByRole("table");
    expect(table).toHaveClass("bx--data-table--static");
  });

  // Custom cell display tests
  it("handles custom cell display", () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      {
        key: "port",
        value: "Port",
        display: (value: string | number | boolean) => `Port ${value}`,
      },
    ];

    render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
      },
    });

    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const portCells = tableRows.map(
      (row) => within(row).getAllByRole("cell")[1],
    );
    expect(portCells[0]).toHaveTextContent("Port 3000");
    expect(portCells[1]).toHaveTextContent("Port 443");
    expect(portCells[2]).toHaveTextContent("Port 80");
  });

  it("handles empty columns for custom content", () => {
    const emptyColumnHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
      { key: "actions", value: "", empty: true },
    ] as const;

    render(DataTable, {
      props: {
        headers: emptyColumnHeaders,
        rows,
      },
    });

    // Verify empty column header exists and has no text content
    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells.length).toBe(5); // 4 regular headers + 1 empty column
    expect(headerCells[4]).toHaveTextContent("");

    // Verify empty column cells exist in each row
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    for (const row of tableRows) {
      const cells = within(row).getAllByRole("cell");
      expect(cells.length).toBe(5);
    }
  });

  // Pagination tests
  it("handles pagination", async () => {
    const paginatedRows = Array.from({ length: 15 }).map((_, i) => ({
      id: `row-${i}`,
      name: `Load Balancer ${i + 1}`,
      protocol: "HTTP",
      port: 3000 + i,
      rule: i % 2 ? "Round robin" : "DNS delegation",
    }));

    const { rerender } = render(DataTable, {
      props: {
        headers,
        rows: paginatedRows,
        pageSize: 5,
        page: 1,
      },
    });

    // Verify only 5 rows are displayed on first page
    const firstPageRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(firstPageRows.length).toBe(5);
    expect(
      within(firstPageRows[0]).getByRole("cell", { name: "Load Balancer 1" }),
    ).toHaveTextContent("Load Balancer 1");
    expect(
      within(firstPageRows[4]).getByRole("cell", { name: "Load Balancer 5" }),
    ).toHaveTextContent("Load Balancer 5");

    // Update page to 2
    rerender({ headers, rows: paginatedRows, pageSize: 5, page: 2 });
    await tick();

    // Verify 5 rows are displayed on second page
    const secondPageRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(secondPageRows.length).toBe(5);
    expect(
      within(secondPageRows[0]).getByRole("cell", { name: "Load Balancer 6" }),
    ).toHaveTextContent("Load Balancer 6");
    expect(
      within(secondPageRows[4]).getByRole("cell", { name: "Load Balancer 10" }),
    ).toHaveTextContent("Load Balancer 10");

    // Update page to 3
    rerender({ page: 3 });
    await tick();

    // Verify remaining rows are displayed on third page
    const thirdPageRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(thirdPageRows.length).toBe(5);
    expect(
      within(thirdPageRows[0]).getByRole("cell", { name: "Load Balancer 11" }),
    ).toHaveTextContent("Load Balancer 11");
    expect(
      within(thirdPageRows[4]).getByRole("cell", { name: "Load Balancer 15" }),
    ).toHaveTextContent("Load Balancer 15");
  });

  // Event handling tests
  it("emits proper events", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(DataTable, {
      props: {
        headers,
        rows,
        sortable: true,
      },
    });

    // Click header
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    // Click row
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRow = tableRows[0];
    await user.click(firstRow);

    // Click cell
    const firstCell = within(firstRow).getAllByRole("cell")[0];
    await user.click(firstCell);

    // Verify events were logged
    expect(consoleLog).toHaveBeenCalledWith("click:header", expect.any(Object));
    expect(consoleLog).toHaveBeenCalledWith("click:row", expect.any(Object));
    expect(consoleLog).toHaveBeenCalledWith("click:cell", expect.any(Object));
  });

  it("handles row hover events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(DataTable, {
      props: {
        headers,
        rows,
      },
    });

    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRow = tableRows[0];
    await user.hover(firstRow);
    await user.unhover(firstRow);

    expect(consoleLog).toHaveBeenCalledWith(
      "mouseenter:row",
      expect.any(Object),
    );
    expect(consoleLog).toHaveBeenCalledWith(
      "mouseleave:row",
      expect.any(Object),
    );
  });

  it("should handle changing number of headers without crashing", async () => {
    const rows = [
      {
        id: "a",
        name: "Load Balancer 3",
        protocol: "HTTP",
        port: 3000,
        rule: "Round robin",
      },
      {
        id: "b",
        name: "Load Balancer 1",
        protocol: "HTTP",
        port: 443,
        rule: "Round robin",
      },
    ];

    const headers5 = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
      { key: "actions", value: "Actions" },
    ];

    const headers3 = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
    ];

    const { component, rerender } = render(DataTable, {
      props: {
        rows,
        headers: headers5,
      },
    });

    // First render with 5 headers
    expect(component).toBeTruthy();

    // Change to 3 headers - this should not crash
    await rerender({
      rows,
      headers: headers3,
    });

    expect(component).toBeTruthy();

    // Change back to 5 headers - this should not crash
    await rerender({
      rows,
      headers: headers5,
    });

    expect(component).toBeTruthy();
  });

  it("should handle empty headers correctly", () => {
    const rows = [
      {
        id: "a",
        name: "Load Balancer 3",
        protocol: "HTTP",
        port: 3000,
        rule: "Round robin",
      },
    ];

    const headersWithEmpty = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "actions", value: "", empty: true, columnMenu: true },
    ];

    const { component } = render(DataTable, {
      props: {
        rows,
        headers: headersWithEmpty,
      },
    });

    expect(component).toBeTruthy();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1594
  it("renders custom title element with props", () => {
    render(DataTableCustomSlots);

    const customTitle = screen.getByRole("heading", { level: 2 });
    expect(customTitle).toBeInTheDocument();
    expect(customTitle).toHaveTextContent("Custom Title");
    expect(customTitle).toHaveClass("bx--data-table-header__title");
  });

  it("renders custom description element with props", () => {
    const { container } = render(DataTableCustomDescription);

    const customDescription = container.querySelector(
      "div.bx--data-table-header__description",
    );
    expect(customDescription).toBeInTheDocument();
    expect(customDescription).toHaveTextContent("Custom Description");
    expect(customDescription).toHaveClass("bx--data-table-header__description");
  });

  it("renders both custom title and description elements", () => {
    const { container } = render(DataTableCustomBoth);

    const customTitle = screen.getByRole("heading", { level: 2 });
    expect(customTitle).toBeInTheDocument();
    expect(customTitle).toHaveClass("bx--data-table-header__title");

    const customDescription = container.querySelector(
      "div.bx--data-table-header__description",
    );
    expect(customDescription).toBeInTheDocument();
    expect(customDescription).toHaveClass("bx--data-table-header__description");
  });

  // Slot prop tests
  it("passes rowSelected and rowExpanded props to cell slot", () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        selectedRowIds: ["a"],
        expandedRowIds: ["b"],
        headers,
        rows,
      },
    });

    // Verify the component renders with selected and expanded rows
    const selectedRow = container.querySelector("tr[data-row='a']");
    expect(selectedRow).toHaveClass("bx--data-table--selected");

    const expandedRow = container.querySelector("tr[data-row='b']");
    expect(expandedRow).toHaveClass("bx--expandable-row");
  });

  it("passes rowSelected prop to expanded-row slot", () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        selectedRowIds: ["a"],
        expandedRowIds: ["a"],
        headers,
        rows,
      },
    });

    // Verify both selected and expanded classes are present on the same row
    const row = container.querySelector("tr[data-row='a']");
    expect(row).toHaveClass("bx--data-table--selected");
    expect(row).toHaveClass("bx--expandable-row");

    // Verify expanded content is visible
    const expandedContent = container.querySelector(
      "#expandable-row-a .bx--child-row-inner-container",
    );
    expect(expandedContent).toBeInTheDocument();
  });

  it("updates rowSelected slot prop when selection changes", async () => {
    const { container, rerender } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        selectedRowIds: [],
        expandedRowIds: [],
        headers,
        rows,
      },
    });

    // Initially no rows selected
    let selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).not.toBeInTheDocument();

    // Select row 'a'
    rerender({ selectedRowIds: ["a"] });
    await tick();

    // Verify row is now selected
    selectedRow = container.querySelector("tr[data-row='a']");
    expect(selectedRow).toHaveClass("bx--data-table--selected");
  });

  it("updates rowExpanded slot prop when expansion changes", async () => {
    const { container, rerender } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        selectedRowIds: ["a"],
        expandedRowIds: [],
        headers,
        rows,
      },
    });

    // Initially no rows expanded
    let expandedContent = container.querySelector(
      ".bx--child-row-inner-container",
    );
    expect(expandedContent).not.toBeInTheDocument();

    // Expand row 'a'
    rerender({ expandedRowIds: ["a"] });
    await tick();

    // Verify row is now expanded
    expandedContent = container.querySelector(
      "#expandable-row-a .bx--child-row-inner-container",
    );
    expect(expandedContent).toBeInTheDocument();
  });

  it("includes target and currentTarget in click:row event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
      },
    });

    const firstRow = container.querySelector("tbody tr");
    assert(firstRow);
    await user.click(firstRow);

    expect(consoleLog).toHaveBeenCalledWith("click:row", {
      row: expect.objectContaining({ id: "a" }),
      target: expect.any(Object),
      currentTarget: expect.any(Object),
    });

    const callArgs = consoleLog.mock.calls.find(
      (call) => call[0] === "click:row",
    );
    expect(callArgs).toBeDefined();
    if (callArgs) {
      const detail = callArgs[1];
      expect(detail.target).toBeInstanceOf(HTMLElement);
      expect(detail.currentTarget).toBeInstanceOf(HTMLElement);
    }
  });

  it("includes target and currentTarget in click:cell event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
      },
    });

    const firstCell = container.querySelector("td");
    assert(firstCell);
    await user.click(firstCell);

    expect(consoleLog).toHaveBeenCalledWith("click:cell", {
      cell: expect.objectContaining({ key: "name" }),
      target: expect.any(Object),
      currentTarget: expect.any(Object),
    });

    const callArgs = consoleLog.mock.calls.find(
      (call) => call[0] === "click:cell",
    );
    expect(callArgs).toBeDefined();
    if (callArgs) {
      const detail = callArgs[1];
      expect(detail.target).toBeInstanceOf(HTMLElement);
      expect(detail.currentTarget).toBeInstanceOf(HTMLElement);
    }
  });

  it("includes target and currentTarget in click:header event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(DataTable, {
      props: {
        headers,
        rows,
        sortable: true,
      },
    });

    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    expect(consoleLog).toHaveBeenCalledWith("click:header", {
      header: expect.objectContaining({ key: "name" }),
      sortDirection: "ascending",
      target: expect.any(Object),
      currentTarget: expect.any(Object),
    });

    const callArgs = consoleLog.mock.calls.find(
      (call) => call[0] === "click:header",
    );
    expect(callArgs).toBeDefined();
    if (callArgs) {
      const detail = callArgs[1];
      expect(detail.target).toBeInstanceOf(HTMLElement);
      expect(detail.currentTarget).toBeInstanceOf(HTMLElement);
    }
  });

  it("includes target and currentTarget when clicking non-sortable header", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", sort: false as const },
    ];

    render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
        sortable: true,
      },
    });

    const protocolHeader = screen.getByText("Protocol");
    await user.click(protocolHeader);

    expect(consoleLog).toHaveBeenCalledWith("click:header", {
      header: expect.objectContaining({ key: "protocol" }),
      target: expect.any(Object),
      currentTarget: expect.any(Object),
    });

    const callArgs = consoleLog.mock.calls.find(
      (call) => call[0] === "click:header",
    );
    expect(callArgs).toBeDefined();
    if (callArgs) {
      const detail = callArgs[1];
      expect(detail.target).toBeInstanceOf(HTMLElement);
      expect(detail.currentTarget).toBeInstanceOf(HTMLElement);
      // Non-sortable headers should not include sortDirection
      expect(detail.sortDirection).toBeUndefined();
    }
  });

  it("allows filtering click:row events based on target element", async () => {
    render(DataTable, {
      props: {
        headers: headers,
        rows: [
          { id: "a", name: "Load Balancer 1" },
          { id: "b", name: "Load Balancer 2" },
        ],
      },
    });

    const consoleLog = vi.spyOn(console, "log");

    // Add a button to the empty cell using slot
    const tableRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    const firstRow = tableRows[0];
    const _emptyCell = within(firstRow).getAllByRole("cell").slice(-1)[0];

    // Click on the row but not on an interactive element
    await user.click(firstRow);

    // Should have dispatched click:row
    const clickRowCalls = consoleLog.mock.calls.filter(
      (call) => call[0] === "click:row",
    );
    expect(clickRowCalls.length).toBeGreaterThan(0);

    // Verify we have access to target to implement custom filtering logic
    const detail = clickRowCalls[0][1];
    expect(detail).toHaveProperty("target");
    expect(detail).toHaveProperty("currentTarget");
    expect(detail).toHaveProperty("row");
  });

  it("uses default table header translations", () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    const nameHeader = screen.getByText("Name");
    const headerButton = nameHeader.closest("button");
    assert(headerButton);

    const sortIcon = headerButton.querySelector(".bx--table-sort__icon");
    assert(sortIcon);
    expect(sortIcon).toHaveAttribute(
      "aria-label",
      "Sort rows by this header in ascending order",
    );
  });

  it("applies custom table header translations", async () => {
    const customTranslator = (id: string) => {
      const translations: Record<string, string> = {
        columnSortAscending: "Trier par ordre croissant",
        columnSortDescending: "Trier par ordre décroissant",
      };
      return translations[id] || id;
    };

    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
        tableHeaderTranslateWithId: customTranslator,
      },
    });

    const nameHeader = screen.getByText("Name");
    const headerButton = nameHeader.closest("button");
    assert(headerButton);

    const sortIcon = headerButton.querySelector(".bx--table-sort__icon");
    assert(sortIcon);
    expect(sortIcon).toHaveAttribute("aria-label", "Trier par ordre croissant");

    await user.click(nameHeader);
    expect(sortIcon).toHaveAttribute(
      "aria-label",
      "Trier par ordre décroissant",
    );
  });

  it("updates aria-label based on sort state", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    const nameHeader = screen.getByText("Name");
    const headerButton = nameHeader.closest("button");
    assert(headerButton);

    const sortIcon = headerButton.querySelector(".bx--table-sort__icon");
    assert(sortIcon);

    expect(sortIcon).toHaveAttribute(
      "aria-label",
      "Sort rows by this header in ascending order",
    );

    await user.click(nameHeader);
    expect(sortIcon).toHaveAttribute(
      "aria-label",
      "Sort rows by this header in descending order",
    );

    await user.click(nameHeader);
    expect(sortIcon).toHaveAttribute(
      "aria-label",
      "Sort rows by this header in ascending order",
    );
  });

  // Regression test for issue https://github.com/carbon-design-system/carbon-components-svelte/issues/2344
  describe("TypeScript event type definitions", () => {
    it("click:row event type includes target and currentTarget", () => {
      type Events = ComponentEvents<DataTableComponent<(typeof rows)[number]>>;
      type ClickRowEventType = Events["click:row"];
      type ClickRowEvent = ClickRowEventType extends CustomEvent<infer T>
        ? T
        : never;

      expectTypeOf<ClickRowEvent>().toHaveProperty("row");
      expectTypeOf<ClickRowEvent>().toHaveProperty("target");
      expectTypeOf<ClickRowEvent>().toHaveProperty("currentTarget");
      expectTypeOf<ClickRowEvent["target"]>().toEqualTypeOf<EventTarget>();
      expectTypeOf<
        ClickRowEvent["currentTarget"]
      >().toEqualTypeOf<EventTarget>();
    });

    it("click:cell event type includes target and currentTarget", () => {
      type Events = ComponentEvents<DataTableComponent<(typeof rows)[number]>>;
      type ClickCellEventType = Events["click:cell"];
      type ClickCellEvent = ClickCellEventType extends CustomEvent<infer T>
        ? T
        : never;

      expectTypeOf<ClickCellEvent>().toHaveProperty("cell");
      expectTypeOf<ClickCellEvent>().toHaveProperty("target");
      expectTypeOf<ClickCellEvent>().toHaveProperty("currentTarget");
      expectTypeOf<ClickCellEvent["target"]>().toEqualTypeOf<EventTarget>();
      expectTypeOf<
        ClickCellEvent["currentTarget"]
      >().toEqualTypeOf<EventTarget>();
    });

    it("click:header event type includes target and currentTarget", () => {
      type Events = ComponentEvents<DataTableComponent<(typeof rows)[number]>>;
      type ClickHeaderEventType = Events["click:header"];
      type ClickHeaderEvent = ClickHeaderEventType extends CustomEvent<infer T>
        ? T
        : never;

      expectTypeOf<ClickHeaderEvent>().toHaveProperty("header");
      expectTypeOf<ClickHeaderEvent>().toHaveProperty("target");
      expectTypeOf<ClickHeaderEvent>().toHaveProperty("currentTarget");
      expectTypeOf<ClickHeaderEvent["target"]>().toEqualTypeOf<EventTarget>();
      expectTypeOf<
        ClickHeaderEvent["currentTarget"]
      >().toEqualTypeOf<EventTarget>();

      expectTypeOf<ClickHeaderEvent>().toHaveProperty("sortDirection");
    });
  });

  describe("Generics", () => {
    it("should support generic types with ComponentProps and ComponentEvents", () => {
      type CustomRow = {
        id: string;
        name: string;
        age: number;
        email: string;
        status: "active" | "inactive";
      };

      type ComponentType = DataTableComponent<CustomRow>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["rows"]>>().toEqualTypeOf<
        readonly CustomRow[]
      >();

      type ClickRowEvent = Events["click:row"];
      type ClickRowEventDetail = ClickRowEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<ClickRowEventDetail["row"]>().toEqualTypeOf<CustomRow>();

      type ClickCellEvent = Events["click:cell"];
      type ClickCellEventDetail = ClickCellEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<ClickCellEventDetail["cell"]>().toHaveProperty("key");
      expectTypeOf<ClickCellEventDetail["cell"]>().toHaveProperty("value");

      type ClickEvent = Events["click"];
      type ClickEventDetail = ClickEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<ClickEventDetail["row"]>().toEqualTypeOf<
        CustomRow | undefined
      >();
    });

    it("should default to DataTableRow when generic is not specified", () => {
      type ComponentType = DataTableComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["rows"]>>().toHaveProperty("length");

      type RowElement = NonNullable<Props["rows"]>[number];
      expectTypeOf<RowElement>().toHaveProperty("id");

      type ClickRowEvent = Events["click:row"];
      type ClickRowEventDetail = ClickRowEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<ClickRowEventDetail>().toHaveProperty("row");
      expectTypeOf<ClickRowEventDetail["row"]>().toHaveProperty("id");
    });
  });
});
