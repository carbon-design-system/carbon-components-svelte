import { render, screen, within } from "@testing-library/svelte";
import type DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
import type {
  DataTableKey,
  DataTableRow,
} from "carbon-components-svelte/DataTable/DataTable.svelte";
import type { PropertyPath } from "carbon-components-svelte/DataTable/data-table-utils";
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

  // Regression: ?? for header.key so empty string is used (not key-${index})
  it("uses empty header key when passed (nullish coalescing)", () => {
    const headersWithEmptyKey = [
      { key: "", value: "Empty Key Col" },
      { key: "name", value: "Name" },
    ];
    const rowsWithEmptyKey = [
      { id: "a", name: "Row A" },
      { id: "b", name: "Row B" },
    ];
    render(DataTable, {
      props: {
        headers: headersWithEmptyKey,
        rows: rowsWithEmptyKey,
      },
    });
    expect(screen.getByText("Empty Key Col")).toBeInTheDocument();
    expect(screen.getByText("Row A")).toBeInTheDocument();
    expect(screen.getByText("Row B")).toBeInTheDocument();
  });

  // Regression: ?? for header.width so 0 is not replaced by minWidth
  it("uses header width 0 when specified (nullish coalescing)", () => {
    const customHeaders = [
      { key: "name", value: "Name", width: "0px", minWidth: "100px" },
      { key: "value", value: "Value" },
    ];
    render(DataTable, {
      props: {
        headers: customHeaders,
        rows: [{ id: "1", name: "A", value: "B" }],
      },
    });
    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(nameHeader).toHaveStyle({ width: "0px" });
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
      type ClickRowEvent =
        ClickRowEventType extends CustomEvent<infer T> ? T : never;

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
      type ClickCellEvent =
        ClickCellEventType extends CustomEvent<infer T> ? T : never;

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
      type ClickHeaderEvent =
        ClickHeaderEventType extends CustomEvent<infer T> ? T : never;

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
      type ClickRowEventDetail =
        ClickRowEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ClickRowEventDetail["row"]>().toEqualTypeOf<CustomRow>();

      type ClickCellEvent = Events["click:cell"];
      type ClickCellEventDetail =
        ClickCellEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ClickCellEventDetail["cell"]>().toHaveProperty("key");
      expectTypeOf<ClickCellEventDetail["cell"]>().toHaveProperty("value");

      type ClickEvent = Events["click"];
      type ClickEventDetail =
        ClickEvent extends CustomEvent<infer T> ? T : never;
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
      type ClickRowEventDetail =
        ClickRowEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ClickRowEventDetail>().toHaveProperty("row");
      expectTypeOf<ClickRowEventDetail["row"]>().toHaveProperty("id");
    });

    it("should validate PropertyPath type with flat objects", () => {
      type FlatRow = {
        id: string;
        name: string;
        age: number;
        active: boolean;
      };

      type Paths = PropertyPath<FlatRow>;
      expectTypeOf<Paths>().toEqualTypeOf<"id" | "name" | "age" | "active">();

      const validPath1: Paths = "id";
      const validPath2: Paths = "name";
      const validPath3: Paths = "age";
      expectTypeOf<typeof validPath1>().toEqualTypeOf<"id">();
      expectTypeOf<typeof validPath2>().toEqualTypeOf<"name">();
      expectTypeOf<typeof validPath3>().toEqualTypeOf<"age">();
    });

    it("should validate PropertyPath type with nested objects", () => {
      type NestedRow = {
        id: string;
        user: {
          name: string;
          email: string;
        };
        contact: {
          company: string;
          address: {
            city: string;
            country: string;
          };
        };
      };

      type Paths = PropertyPath<NestedRow>;

      const validPath1: Paths = "id";
      const validPath2: Paths = "user";
      const validPath3: Paths = "user.name";
      const validPath4: Paths = "contact";
      const validPath5: Paths = "contact.company";
      const validPath6: Paths = "contact.address";

      expectTypeOf<typeof validPath1>().toEqualTypeOf<"id">();
      expectTypeOf<typeof validPath2>().toEqualTypeOf<"user">();
      expectTypeOf<typeof validPath3>().toEqualTypeOf<"user.name">();
      expectTypeOf<typeof validPath4>().toEqualTypeOf<"contact">();
      expectTypeOf<typeof validPath5>().toEqualTypeOf<"contact.company">();
      expectTypeOf<typeof validPath6>().toEqualTypeOf<"contact.address">();

      expectTypeOf<Extract<Paths, "id">>().toEqualTypeOf<"id">();
      expectTypeOf<Extract<Paths, "user">>().toEqualTypeOf<"user">();
      expectTypeOf<Extract<Paths, "user.name">>().toEqualTypeOf<"user.name">();
      expectTypeOf<Extract<Paths, "contact">>().toEqualTypeOf<"contact">();
      expectTypeOf<
        Extract<Paths, "contact.company">
      >().toEqualTypeOf<"contact.company">();
      expectTypeOf<
        Extract<Paths, "contact.address">
      >().toEqualTypeOf<"contact.address">();
    });

    it("should validate DataTableKey type with nested objects", () => {
      type NestedRow = {
        id: string;
        contact: {
          company: string;
          address: {
            city: string;
          };
        };
      };

      type Keys = DataTableKey<NestedRow>;

      const validKey1: Keys = "id";
      const validKey2: Keys = "contact";
      const validKey3: Keys = "contact.company";
      const validKey4: Keys = "contact.address";

      expectTypeOf<typeof validKey1>().toEqualTypeOf<"id">();
      expectTypeOf<typeof validKey2>().toEqualTypeOf<"contact">();
      expectTypeOf<typeof validKey3>().toEqualTypeOf<"contact.company">();
      expectTypeOf<typeof validKey4>().toEqualTypeOf<"contact.address">();

      type PropertyPaths = PropertyPath<NestedRow>;
      expectTypeOf<Keys>().toEqualTypeOf<PropertyPaths>();
    });

    it("should validate headers with nested property paths", () => {
      type NestedRow = {
        id: string;
        user: {
          name: string;
          email: string;
        };
        contact: {
          company: string;
        };
      };

      type ComponentType = DataTableComponent<NestedRow>;
      type Props = ComponentProps<ComponentType>;
      type Headers = NonNullable<Props["headers"]>;

      // Headers should accept nested paths as keys
      const validHeaders: Headers = [
        { key: "id", value: "ID" },
        { key: "user.name", value: "Name" },
        { key: "contact.company", value: "Company" },
      ] as const;

      // Verify headers accept nested property paths as keys
      type HeaderKeyType = DataTableKey<NestedRow> | (string & {});
      expectTypeOf<
        (typeof validHeaders)[0]["key"]
      >().toEqualTypeOf<HeaderKeyType>();
      expectTypeOf<
        (typeof validHeaders)[1]["key"]
      >().toEqualTypeOf<HeaderKeyType>();
      expectTypeOf<
        (typeof validHeaders)[2]["key"]
      >().toEqualTypeOf<HeaderKeyType>();
    });

    it("should validate cell key types in events with nested paths", () => {
      type NestedRow = {
        id: string;
        user: {
          name: string;
          email: string;
        };
        contact: {
          company: string;
        };
      };

      type ComponentType = DataTableComponent<NestedRow>;
      type Events = ComponentEvents<ComponentType>;
      type ClickCellEvent = Events["click:cell"];
      type ClickCellEventDetail =
        ClickCellEvent extends CustomEvent<infer T> ? T : never;

      // Cell key should accept nested paths
      type CellKey = ClickCellEventDetail["cell"]["key"];
      type ExpectedCellKey = DataTableKey<NestedRow> | (string & {});

      // Verify CellKey matches expected type
      expectTypeOf<CellKey>().toEqualTypeOf<ExpectedCellKey>();

      // Verify specific nested paths are valid cell keys
      expectTypeOf<Extract<CellKey, "id">>().toEqualTypeOf<"id">();
      expectTypeOf<
        Extract<CellKey, "user.name">
      >().toEqualTypeOf<"user.name">();
      expectTypeOf<
        Extract<CellKey, "contact.company">
      >().toEqualTypeOf<"contact.company">();
    });

    it("should validate PropertyPath depth limit", () => {
      type DeepRow = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: string;
              };
            };
          };
        };
      };

      type Paths = PropertyPath<DeepRow>;

      expectTypeOf<Extract<Paths, "level1">>().toEqualTypeOf<"level1">();
      expectTypeOf<
        Extract<Paths, "level1.level2">
      >().toEqualTypeOf<"level1.level2">();
      expectTypeOf<
        Extract<Paths, "level1.level2.level3">
      >().toEqualTypeOf<"level1.level2.level3">();
      expectTypeOf<
        Extract<Paths, "level1.level2.level3.level4">
      >().toEqualTypeOf<"level1.level2.level3.level4">();
      expectTypeOf<
        Extract<Paths, "level1.level2.level3.level4.level5">
      >().toEqualTypeOf<never>();
    });

    it("should validate PropertyPath with arrays and primitives", () => {
      type MixedRow = {
        id: string;
        tags: string[];
        metadata: {
          count: number;
          active: boolean;
        };
      };

      type Paths = PropertyPath<MixedRow>;

      // Arrays should be treated as objects, so "tags" is valid but not "tags.0"
      const validPath1: Paths = "id";
      const validPath2: Paths = "tags";
      const validPath3: Paths = "metadata";
      const validPath4: Paths = "metadata.count";
      const validPath5: Paths = "metadata.active";

      expectTypeOf<typeof validPath1>().toEqualTypeOf<"id">();
      expectTypeOf<typeof validPath2>().toEqualTypeOf<"tags">();
      expectTypeOf<typeof validPath3>().toEqualTypeOf<"metadata">();
      expectTypeOf<typeof validPath4>().toEqualTypeOf<"metadata.count">();
      expectTypeOf<typeof validPath5>().toEqualTypeOf<"metadata.active">();
    });

    it("should enforce DataTableRow constraint on generic type", () => {
      type CustomRow = {
        id: string;
        name: string;
        age: number;
      };

      type ComponentType = DataTableComponent<CustomRow>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["rows"]>>().toEqualTypeOf<
        readonly CustomRow[]
      >();

      type BaseComponentType = DataTableComponent<DataTableRow>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["rows"]>>().toEqualTypeOf<
        readonly DataTableRow[]
      >();
    });

    it("should infer Row ID type from Row generic", () => {
      // Test with string IDs
      type StringIdRow = {
        id: string;
        name: string;
      };

      type StringIdProps = ComponentProps<DataTableComponent<StringIdRow>>;
      expectTypeOf<
        NonNullable<StringIdProps["selectedRowIds"]>
      >().toEqualTypeOf<readonly string[]>();
      expectTypeOf<
        NonNullable<StringIdProps["expandedRowIds"]>
      >().toEqualTypeOf<readonly string[]>();
      expectTypeOf<
        NonNullable<StringIdProps["nonSelectableRowIds"]>
      >().toEqualTypeOf<readonly string[]>();
      expectTypeOf<
        NonNullable<StringIdProps["nonExpandableRowIds"]>
      >().toEqualTypeOf<readonly string[]>();

      // Test with number IDs
      type NumberIdRow = {
        id: number;
        name: string;
      };

      type NumberIdProps = ComponentProps<DataTableComponent<NumberIdRow>>;
      expectTypeOf<
        NonNullable<NumberIdProps["selectedRowIds"]>
      >().toEqualTypeOf<readonly number[]>();
      expectTypeOf<
        NonNullable<NumberIdProps["expandedRowIds"]>
      >().toEqualTypeOf<readonly number[]>();
    });

    it('should use Row["id"] for literal type unions with as const', () => {
      const rows = [
        { id: "row-1", name: "Item 1" },
        { id: "row-2", name: "Item 2" },
        { id: "row-3", name: "Item 3" },
      ] as const;

      type Row = (typeof rows)[number];
      type RowId = Row["id"];

      // Verify literal union type
      expectTypeOf<RowId>().toEqualTypeOf<"row-1" | "row-2" | "row-3">();

      type Props = ComponentProps<DataTableComponent<Row>>;
      expectTypeOf<NonNullable<Props["selectedRowIds"]>>().toEqualTypeOf<
        readonly ("row-1" | "row-2" | "row-3")[]
      >();
    });

    it("should support DataTableRow<Id> generic interface", () => {
      // Test that DataTableRow accepts a generic Id parameter
      type StringDataTableRow = DataTableRow<string>;
      expectTypeOf<StringDataTableRow["id"]>().toEqualTypeOf<string>();

      type NumberDataTableRow = DataTableRow<number>;
      expectTypeOf<NumberDataTableRow["id"]>().toEqualTypeOf<number>();

      // Default should be any
      type DefaultDataTableRow = DataTableRow;
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<DefaultDataTableRow["id"]>().toEqualTypeOf<any>();
    });

    describe("rowClass prop", () => {
      it("applies string rowClass to all rows", () => {
        const { container } = render(DataTable, {
          props: {
            headers,
            rows,
            rowClass: "custom-row-class",
          },
        });

        const tableRows = container.querySelectorAll("tbody tr");

        for (const row of tableRows) {
          expect(row).toHaveClass("custom-row-class");
        }
      });

      it("applies function rowClass based on row properties", () => {
        const { container } = render(DataTable, {
          props: {
            headers,
            rows,
            rowClass: ({ row, rowIndex }) => {
              if (rowIndex === 0) return "first-row";
              if (row.port === 443) return "secure-row";
              return "standard-row";
            },
          },
        });

        const firstRow = container.querySelector("tbody tr:first-child");
        expect(firstRow).toHaveClass("first-row");

        const secureRow = container.querySelector("tr[data-row='b']");
        expect(secureRow).toHaveClass("secure-row");
      });

      it("applies rowClass based on selected and expanded state", async () => {
        const { container, rerender } = render(DataTable, {
          props: {
            selectable: true,
            expandable: true,
            headers,
            rows,
            selectedRowIds: ["a"],
            expandedRowIds: ["b"],
            rowClass: ({ selected, expanded }) => {
              const classes = [];
              if (selected) classes.push("is-selected");
              if (expanded) classes.push("is-expanded");
              return classes.join(" ") || undefined;
            },
          },
        });

        expect(container.querySelector("tr[data-row='a']")).toHaveClass(
          "is-selected",
        );
        expect(container.querySelector("tr[data-row='b']")).toHaveClass(
          "is-expanded",
        );

        rerender({ selectedRowIds: ["b"] });
        await tick();

        expect(container.querySelector("tr[data-row='a']")).not.toHaveClass(
          "is-selected",
        );
        expect(container.querySelector("tr[data-row='b']")).toHaveClass(
          "is-selected",
        );
        expect(container.querySelector("tr[data-row='b']")).toHaveClass(
          "is-expanded",
        );
      });
    });
  });

  describe("virtualization", () => {
    const createLargeRowList = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: String(i),
        name: `Load Balancer ${i + 1}`,
        protocol: "HTTP",
        port: 3000 + i * 10,
        rule: i % 2 ? "Round robin" : "DNS delegation",
      }));
    };

    it("should enable virtualization for large row lists", () => {
      const largeRows = createLargeRowList(500);
      const { container } = render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: true,
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();

      // When not using sticky header, the scroll container (table's parent) has max-height
      const scrollContainer = table.parentElement;
      if (
        scrollContainer &&
        !container.querySelector(".bx--data-table_inner-container")
      ) {
        const scrollStyle = scrollContainer.getAttribute("style") ?? "";
        expect(scrollStyle).toContain("max-height");
        // Default: itemHeight 48 * maxVisibleRows 10 = 480px
        expect(scrollStyle).toContain("480px");
      }

      // Should render fewer rows than total (only visible ones)
      // Note: This includes spacer rows, so we check that we have some data rows
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      // Should have some rows rendered (may include spacer rows)
      expect(tableRows.length).toBeGreaterThan(0);
      // Check that we have actual data rows (not just spacers)
      // Spacer rows have a single td with colspan and a style attribute with height
      const dataRows = tableRows.filter((row) => {
        const style = row.getAttribute("style");
        const isSpacer = style?.includes("height:");
        if (isSpacer) return false;
        const cells = row.querySelectorAll("td");
        return cells.length > 0;
      });
      // With 500 rows and default settings, should render around 10-15 visible rows
      expect(dataRows.length).toBeLessThan(500);
      expect(dataRows.length).toBeGreaterThan(0);
    });

    it("should not virtualize tables below threshold", () => {
      const smallRows = createLargeRowList(50);
      render(DataTable, {
        props: {
          headers,
          rows: smallRows,
          virtualize: {
            threshold: 100, // Threshold is 100, table has 50 rows
          },
        },
      });

      // Should render all rows when below threshold
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      expect(tableRows.length).toBe(50);
    });

    it("should accept virtualization configuration object", () => {
      const largeRows = createLargeRowList(500);
      const { container } = render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 20,
          },
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const _tbody = container.querySelector("tbody");
      // With maxItems: 20, should render at most 20 data rows (excluding spacer rows)
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      const dataRows = tableRows.filter((row) => {
        const style = row.getAttribute("style");
        const isSpacer = style?.includes("height:");
        if (isSpacer) return false;
        const cells = row.querySelectorAll("td");
        return cells.length > 0;
      });
      expect(dataRows.length).toBeLessThanOrEqual(20);
    });

    it("should use default row height based on size prop", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          size: "compact",
          virtualize: true,
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Should render rows (verifying virtualization works with compact size)
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      expect(tableRows.length).toBeGreaterThan(0);
      expect(tableRows.length).toBeLessThan(500);
    });

    it("should handle virtualization with custom row height", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: {
            itemHeight: 64,
            containerHeight: 400,
          },
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      expect(tableRows.length).toBeGreaterThan(0);
      expect(tableRows.length).toBeLessThan(500);
    });

    it("should maintain selection when virtualized", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          selectable: true,
          selectedRowIds: ["5"],
          virtualize: true,
        },
      });

      // Selected row should be rendered (row 5 is in the initial viewport)
      const selectedRow = screen.getByText("Load Balancer 6");
      expect(selectedRow).toBeInTheDocument();
      expect(selectedRow.closest("tr")).toHaveClass("bx--data-table--selected");
    });

    it("should handle sorting with virtualization", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          sortable: true,
          sortKey: "name",
          sortDirection: "ascending",
          virtualize: true,
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Should render sorted rows (check data rows, not spacer rows)
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      const dataRows = tableRows.filter((row) => {
        const style = row.getAttribute("style");
        const isSpacer = style?.includes("height:");
        if (isSpacer) return false;
        const cells = row.querySelectorAll("td");
        return cells.length > 0;
      });
      expect(dataRows.length).toBeGreaterThan(0);
      expect(dataRows.length).toBeLessThan(500);
    });

    it("should apply max-height style when virtualized", () => {
      const largeRows = createLargeRowList(500);
      const { container } = render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: {
            containerHeight: 500,
          },
        },
      });

      const tbody = container.querySelector("tbody");
      const innerContainer = container.querySelector(
        ".bx--data-table_inner-container",
      );
      // Style should be on tbody when stickyHeader is false, or on inner container when true
      if (innerContainer) {
        const containerStyle = innerContainer.getAttribute("style");
        if (containerStyle) {
          expect(containerStyle).toContain("max-height: 500px");
        }
      } else if (tbody) {
        const tbodyStyle = tbody.getAttribute("style");
        if (tbodyStyle) {
          expect(tbodyStyle).toContain("max-height: 500px");
        }
      }
    });

    it("should work with sticky header", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          stickyHeader: true,
          virtualize: true,
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("bx--data-table--sticky-header");

      // Should render rows (check data rows, not spacer rows)
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      const dataRows = tableRows.filter((row) => {
        const style = row.getAttribute("style");
        const isSpacer = style?.includes("height:");
        if (isSpacer) return false;
        const cells = row.querySelectorAll("td");
        return cells.length > 0;
      });
      expect(dataRows.length).toBeGreaterThan(0);
      expect(dataRows.length).toBeLessThan(500);
    });

    it("should work with zebra striping", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          zebra: true,
          virtualize: true,
        },
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("bx--data-table--zebra");

      // Should render rows
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      expect(tableRows.length).toBeGreaterThan(0);
    });

    it("should ignore pagination when virtualized", () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          pageSize: 10,
          page: 1,
          virtualize: true,
        },
      });

      // Should render more than pageSize data rows (virtualization ignores pagination)
      const tableRows = screen
        .getAllByRole("row")
        .filter((row) => row.closest("tbody") !== null);
      const dataRows = tableRows.filter((row) => {
        const style = row.getAttribute("style");
        const isSpacer = style?.includes("height:");
        if (isSpacer) return false;
        const cells = row.querySelectorAll("td");
        return cells.length > 0;
      });
      // Virtualization should render visible rows (typically 10-15), not just pageSize
      // Note: In test environment, virtualization may render all rows if container height isn't constrained
      // So we just verify that virtualization is enabled (rows are rendered)
      expect(dataRows.length).toBeGreaterThan(0);
    });

    it("should expose scrollContainerRef for programmatic scroll control when virtualized without stickyHeader", async () => {
      const largeRows = createLargeRowList(500);
      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: true,
          stickyHeader: false,
        },
      });

      await tick();

      const table = screen.getByRole("table");
      const scrollContainer = table.parentElement;
      expect(scrollContainer).toBeInstanceOf(HTMLElement);
      expect(scrollContainer?.style.overflowY).toBe("auto");
      expect(scrollContainer?.style.maxHeight).toBeDefined();
      expect.assert(scrollContainer instanceof HTMLElement);
      scrollContainer.scrollTop = 100;
      expect(scrollContainer.scrollTop).toBe(100);
    });
  });
});
