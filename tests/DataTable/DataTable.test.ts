import { render, screen } from "@testing-library/svelte";
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
  it("renders with default props", async () => {
    const { container } = render(DataTable);
    // Check if table headers are rendered
    headers.forEach((header) => {
      expect(screen.getByText(header.value)).toBeInTheDocument();
    });

    // Check if table has correct structure
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass("bx--data-table");

    // Check if table has correct number of rows
    const tableRows = container.querySelectorAll("tbody tr");
    expect(tableRows).toHaveLength(3);

    // Check if all rows contain the expected data
    rows.forEach((row) => {
      const rowElement = screen.getByText(row.name).closest("tr");
      expect(rowElement).toBeInTheDocument();
      assert(rowElement);

      const cells = rowElement.querySelectorAll("td");
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
    });
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
    const { container } = render(DataTable, {
      props: {
        headers,
        rows: [],
      },
    });

    const tableBody = container.querySelector("tbody");
    assert(tableBody);
    expect(tableBody.children.length).toBe(0);
  });

  it("handles table with only one column", () => {
    const singleColumnHeaders = [{ key: "name", value: "Name" }];

    const { container } = render(DataTable, {
      props: {
        headers: singleColumnHeaders,
        rows: rows.map(({ id, name }) => ({ id, name })),
      },
    });

    const columns = container.querySelectorAll("th");
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

    const { container } = render(DataTable, {
      props: {
        headers,
        rows: longContentRows,
      },
    });

    const longCell = container.querySelector("td");
    assert(longCell);
    expect(longCell).toBeInTheDocument();
  });

  // Sorting tests
  it("handles sorting functionality", async () => {
    const { container } = render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    // Get all header cells
    const headerCells = container.querySelectorAll("th");
    expect(headerCells.length).toBe(4);

    // Test sorting by name (ascending)
    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    // Verify rows are sorted by name ascending
    const rowsAfterNameSort = container.querySelectorAll("tbody tr");
    const firstRowName = rowsAfterNameSort[0].querySelector("td");
    expect(firstRowName).toHaveTextContent("Load Balancer 1");

    // Test sorting by name (descending)
    await user.click(nameHeader);
    const rowsAfterNameDescSort = container.querySelectorAll("tbody tr");
    const firstRowNameDesc = rowsAfterNameDescSort[0].querySelector("td");
    expect(firstRowNameDesc).toHaveTextContent("Load Balancer 3");

    // Test sorting by port (ascending)
    const portHeader = screen.getByText("Port");
    await user.click(portHeader);

    // Verify rows are sorted by port ascending
    const rowsAfterPortSort = container.querySelectorAll("tbody tr");
    const firstRowPort = rowsAfterPortSort[0].querySelectorAll("td")[2];
    expect(firstRowPort).toHaveTextContent("80");

    // Test sorting by port (descending)
    await user.click(portHeader);
    const rowsAfterPortDescSort = container.querySelectorAll("tbody tr");
    const firstRowPortDesc = rowsAfterPortDescSort[0].querySelectorAll("td")[2];
    expect(firstRowPortDesc).toHaveTextContent("3000");
  });

  it("handles sorting with custom display and sort methods", async () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "cost", value: "Cost", display: (cost: number) => `${cost} €` },
      {
        key: "expireDate",
        value: "Expire date",
        display: (date: string) => new Date(date).toLocaleString(),
        sort: (a: string, b: string) =>
          new Date(a).getTime() - new Date(b).getTime(),
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

    const { container } = render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows: customRows,
      },
    });

    // Verify custom display formatting
    const costCells = container.querySelectorAll("td:nth-child(2)");
    expect(costCells[0]).toHaveTextContent("100 €");
    expect(costCells[1]).toHaveTextContent("200 €");

    // Test sorting by expireDate
    const dateHeader = screen.getByText("Expire date");
    await user.click(dateHeader);

    // Verify rows are sorted by date ascending
    const rowsAfterDateSort = container.querySelectorAll("tbody tr");
    expect(rowsAfterDateSort[0].querySelector("td")).toHaveTextContent(
      "Load Balancer 2",
    );
    expect(rowsAfterDateSort[2].querySelector("td")).toHaveTextContent(
      "Load Balancer 3",
    );
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

    const { container } = render(DataTable, {
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
    const rowsAfterPortSort = container.querySelectorAll("tbody tr");
    expect(rowsAfterPortSort[0].querySelectorAll("td")[2]).toHaveTextContent(
      "80",
    );
    expect(rowsAfterPortSort[1].querySelectorAll("td")[2]).toHaveTextContent(
      "443",
    );
    expect(rowsAfterPortSort[2].querySelectorAll("td")[2]).toHaveTextContent(
      "3000",
    );
  });

  it("handles disabled sorting on specific columns", async () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", sort: false as const },
      { key: "port", value: "Port" },
    ];

    const { container } = render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows,
      },
    });

    const protocolHeader = screen.getByText("Protocol");
    await user.click(protocolHeader);

    // Verify no sorting occurred
    const firstRow = container.querySelector("tbody tr:first-child");
    assert(firstRow);
    expect(firstRow.querySelector("td:first-child")).toHaveTextContent(
      "Load Balancer 3",
    );
  });

  it("handles table with numeric sorting", async () => {
    const numericRows = [
      { id: "a", value: 10 },
      { id: "b", value: 2 },
      { id: "c", value: 20 },
    ];

    const numericHeaders = [{ key: "value", value: "Value" }];

    const { container } = render(DataTable, {
      props: {
        sortable: true,
        headers: numericHeaders,
        rows: numericRows,
      },
    });

    const valueHeader = screen.getByText("Value");
    await user.click(valueHeader);

    const sortedCells = container.querySelectorAll("td");
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
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
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
    const batchCheckbox = container.querySelector(
      ".bx--table-column-checkbox input[type='checkbox']",
    );
    assert(batchCheckbox);

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

    const radioButtons = container.querySelectorAll("input[type='radio']");
    expect(radioButtons.length).toBe(3);

    await user.click(radioButtons[0]);
    const selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).toBeInTheDocument();
  });

  it("handles non-selectable and non-expandable rows", async () => {
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
    const nonSelectableCheckbox = nonSelectableRow?.querySelector(
      "input[type='checkbox']",
    );
    expect(nonSelectableCheckbox).not.toBeInTheDocument();

    // Verify non-expandable row doesn't have an expand button
    const nonExpandableRow = container.querySelector("tr[data-row='c']");
    const nonExpandableButton = nonExpandableRow?.querySelector(
      ".bx--table-expand__button",
    );
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
    const expandButtons = container.querySelectorAll(
      ".bx--table-expand__button",
    );
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
  it("applies zebra stripe styling", async () => {
    const { container } = render(DataTable, {
      props: {
        zebra: true,
        headers,
        rows,
      },
    });

    // Verify zebra stripe classes are applied
    const table = container.querySelector("table");
    expect(table).toHaveClass("bx--data-table--zebra");
  });

  it("applies different size variants", async () => {
    type Size = "compact" | "short" | "medium" | "tall";
    const sizeMappings: Record<Size, string> = {
      compact: "bx--data-table--compact",
      short: "bx--data-table--short",
      medium: "bx--data-table--md",
      tall: "bx--data-table--tall",
    };

    for (const [size, expectedClass] of Object.entries(sizeMappings)) {
      const { container } = render(DataTable, {
        props: {
          size: size as Size,
          headers,
          rows,
        },
      });

      // Verify size class is applied
      const table = container.querySelector("table");
      expect(table).toHaveClass(expectedClass);
    }
  });

  it("applies custom column widths", async () => {
    const customHeaders = [
      { key: "name", value: "Name", width: "200px" },
      { key: "protocol", value: "Protocol", minWidth: "100px" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
    ] as const;

    const { container } = render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
      },
    });

    // Verify table has fixed layout
    const table = container.querySelector("table");
    expect(table).toHaveStyle({ "table-layout": "fixed" });

    // Verify name column has correct width
    const nameHeader = container.querySelector("th:first-child");
    expect(nameHeader).toHaveStyle({ width: "200px" });

    // Verify protocol column has correct min-width
    const protocolHeader = container.querySelector("th:nth-child(2)");
    expect(protocolHeader).toHaveStyle({ "min-width": "100px" });
  });

  it("applies sticky header", async () => {
    const { container } = render(DataTable, {
      props: {
        stickyHeader: true,
        headers,
        rows,
      },
    });

    const table = container.querySelector("table");
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

    const table = container.querySelector("table");
    expect(table).toHaveClass("bx--data-table--static");
  });

  // Custom cell display tests
  it("handles custom cell display", () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      {
        key: "port",
        value: "Port",
        display: (value: number) => `Port ${value}`,
      },
    ];

    const { container } = render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
      },
    });

    const portCells = container.querySelectorAll("td:nth-child(2)");
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

    const { container } = render(DataTable, {
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
    const tableRows = container.querySelectorAll("tbody tr");
    tableRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      expect(cells.length).toBe(5);
    });
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

    const { container, component } = render(DataTable, {
      props: {
        headers,
        rows: paginatedRows,
        pageSize: 5,
        page: 1,
      },
    });

    // Verify only 5 rows are displayed on first page
    const firstPageRows = container.querySelectorAll("tbody tr");
    expect(firstPageRows.length).toBe(5);
    expect(firstPageRows[0].querySelector("td")).toHaveTextContent(
      "Load Balancer 1",
    );
    expect(firstPageRows[4].querySelector("td")).toHaveTextContent(
      "Load Balancer 5",
    );

    // Update page to 2
    component.$set({ page: 2 });
    await tick();

    // Verify 5 rows are displayed on second page
    const secondPageRows = container.querySelectorAll("tbody tr");
    expect(secondPageRows.length).toBe(5);
    expect(secondPageRows[0].querySelector("td")).toHaveTextContent(
      "Load Balancer 6",
    );
    expect(secondPageRows[4].querySelector("td")).toHaveTextContent(
      "Load Balancer 10",
    );

    // Update page to 3
    component.$set({ page: 3 });
    await tick();

    // Verify remaining rows are displayed on third page
    const thirdPageRows = container.querySelectorAll("tbody tr");
    expect(thirdPageRows.length).toBe(5);
    expect(thirdPageRows[0].querySelector("td")).toHaveTextContent(
      "Load Balancer 11",
    );
    expect(thirdPageRows[4].querySelector("td")).toHaveTextContent(
      "Load Balancer 15",
    );
  });

  // Event handling tests
  it("emits proper events", async () => {
    const consoleLog = vi.spyOn(console, "log");

    const { container } = render(DataTable, {
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
    const firstRow = container.querySelector("tbody tr");
    assert(firstRow);
    await user.click(firstRow);

    // Click cell
    const firstCell = container.querySelector("td");
    assert(firstCell);
    await user.click(firstCell);

    // Verify events were logged
    expect(consoleLog).toHaveBeenCalledWith("click:header", expect.any(Object));
    expect(consoleLog).toHaveBeenCalledWith("click:row", expect.any(Object));
    expect(consoleLog).toHaveBeenCalledWith("click:cell", expect.any(Object));
  });

  it("handles row hover events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
      },
    });

    const firstRow = container.querySelector("tbody tr");
    assert(firstRow);
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

  it("should handle empty headers correctly", async () => {
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
  it("passes rowSelected and rowExpanded props to cell slot", async () => {
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

  it("passes rowSelected prop to expanded-row slot", async () => {
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
    const { container, component } = render(DataTable, {
      props: {
        selectable: true,
        expandable: true,
        selectedRowIds: [],
        expandedRowIds: ["a"],
        headers,
        rows,
      },
    });

    // Initially no rows selected
    let selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).not.toBeInTheDocument();

    // Select row 'a'
    component.$set({ selectedRowIds: ["a"] });
    await tick();

    // Verify row is now selected
    selectedRow = container.querySelector("tr[data-row='a']");
    expect(selectedRow).toHaveClass("bx--data-table--selected");
  });

  it("updates rowExpanded slot prop when expansion changes", async () => {
    const { container, component } = render(DataTable, {
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
    component.$set({ expandedRowIds: ["a"] });
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
    const { container } = render(DataTable, {
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
    const firstRow = container.querySelector("tbody tr");
    const emptyCell = firstRow?.querySelector("td:last-child");
    assert(emptyCell);

    // Click on the row but not on an interactive element
    assert(firstRow);
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
});
