import { render, screen, within } from "@testing-library/svelte";
import type DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
import type {
  DataTableKey,
  DataTableRow,
  DataTableValue,
} from "carbon-components-svelte/DataTable/DataTable.svelte";
import type {
  DataTableSortValue,
  DataTableValueAtPath,
  PropertyPath,
} from "carbon-components-svelte/DataTable/data-table-utils";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import DataTableCustomDescription from "./DataTableCustomDescription.test.svelte";
import DataTableCustomSlots from "./DataTableCustomSlots.test.svelte";
import DataTableExpandIcon from "./DataTableExpandIcon.test.svelte";
import DataTableFooter from "./DataTableFooter.test.svelte";
import DataTableSlotProps from "./DataTableSlotProps.test.svelte";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";
import {
  clickHeader,
  eventDetails,
  eventNames,
  getBodyRows,
  getCell,
  getCells,
  getColumnHeaderText,
  getColumnTexts,
  getRenderedRowIds,
  getRowInputs,
  getRowTexts,
  getSelectAll,
} from "./helpers";

describe("DataTable", () => {
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

  it("renders with default props", () => {
    render(DataTable);
    for (const header of headers) {
      expect(screen.getByText(header.value)).toBeInTheDocument();
    }

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass("bx--data-table");

    const tableRows = getBodyRows();
    expect(tableRows).toHaveLength(3);

    for (const row of rows) {
      const rowElement = screen.getByText(row.name).closest("tr");
      expect(rowElement).toBeInTheDocument();
      assert(rowElement);

      const cells = getCells(rowElement);
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

  it("associates data cells with their column headers", () => {
    render(DataTable);

    const columnHeaders = screen.getAllByRole("columnheader");
    headers.forEach((header, i) => {
      expect(columnHeaders[i]).toHaveAttribute(
        "id",
        expect.stringMatching(new RegExp(`-${header.key}$`)),
      );
    });

    const bodyRows = getBodyRows();
    for (const row of bodyRows) {
      const cells = getCells(row);
      cells.forEach((cell, i) => {
        expect(cell).toHaveAttribute("headers", columnHeaders[i].id);
      });
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

  it("labels the table with its title and description", () => {
    render(DataTable, {
      props: {
        title: "Test Table",
        description: "Test Description",
        headers,
        rows,
      },
    });

    const table = screen.getByRole("table");

    const labelledbyId = table.getAttribute("aria-labelledby");
    assert(labelledbyId);
    expect(document.getElementById(labelledbyId)).toHaveTextContent(
      "Test Table",
    );

    const describedbyId = table.getAttribute("aria-describedby");
    assert(describedbyId);
    expect(document.getElementById(describedbyId)).toHaveTextContent(
      "Test Description",
    );
  });

  it("does not set aria-labelledby or aria-describedby without a title", () => {
    render(DataTable, { props: { headers, rows } });

    const table = screen.getByRole("table");
    expect(table).not.toHaveAttribute("aria-labelledby");
    expect(table).not.toHaveAttribute("aria-describedby");
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

  it("handles sorting functionality", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells.length).toBe(4);

    await clickHeader("Name");

    const rowsAfterNameSort = getBodyRows();
    const firstRowName = within(rowsAfterNameSort[0]).getByRole("cell", {
      name: "Load Balancer 1",
    });
    expect(firstRowName).toHaveTextContent("Load Balancer 1");

    await clickHeader("Name");
    const rowsAfterNameDescSort = getBodyRows();
    const firstRowNameDesc = within(rowsAfterNameDescSort[0]).getByRole(
      "cell",
      {
        name: "Load Balancer 3",
      },
    );
    expect(firstRowNameDesc).toHaveTextContent("Load Balancer 3");

    await clickHeader("Port");

    const firstRowPort = getCell(0, 2);
    expect(firstRowPort).toHaveTextContent("80");

    await clickHeader("Port");
    const firstRowPortDesc = getCell(0, 2);
    expect(firstRowPortDesc).toHaveTextContent("3000");
  });

  describe("sort preventDefault", () => {
    const sortHeaders = [
      { key: "name", value: "Name" },
      { key: "port", value: "Port" },
    ];
    const sortRows = [
      { id: "a", name: "Zebra", port: 1 },
      { id: "b", name: "Alpha", port: 2 },
    ];

    it("skips client-side sort but still fires sort with detail", async () => {
      const onsort = vi.fn();
      render(DataTable, {
        props: {
          headers: sortHeaders,
          rows: sortRows,
          sortable: true,
          preventSortDefault: true,
          onsort,
        },
      });

      await clickHeader("Name");

      expect(onsort).toHaveBeenCalledTimes(1);
      expect(onsort.mock.calls[0][0].detail).toEqual({
        key: "name",
        direction: "ascending",
      });
      expect(getCell(0, 0)).toHaveTextContent("Zebra");
    });

    it("still reports the intended direction in click:header", async () => {
      const onevent = vi.fn();
      render(DataTable, {
        props: {
          headers: sortHeaders,
          rows: sortRows,
          sortable: true,
          preventSortDefault: true,
          onevent,
        },
      });

      await clickHeader("Name");

      expect(eventDetails(onevent, "click:header")).toEqual([
        expect.objectContaining({
          header: expect.objectContaining({ key: "name" }),
          sortDirection: "ascending",
        }),
      ]);
    });

    it("applies client-side sort without preventDefault", async () => {
      const onsort = vi.fn();
      render(DataTable, {
        props: { headers: sortHeaders, rows: sortRows, sortable: true, onsort },
      });

      await clickHeader("Name");

      expect(onsort).toHaveBeenCalledTimes(1);
      expect(getCell(0, 0)).toHaveTextContent("Alpha");
    });
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
        sort: (a: DataTableValue, b: DataTableValue) =>
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

    const _table = screen.getByRole("table");
    const tableRows = getBodyRows();
    const costCells = tableRows.map((row) => getCells(row)[1]);
    expect(costCells[0]).toHaveTextContent("100 €");
    expect(costCells[1]).toHaveTextContent("200 €");

    await clickHeader("Expire date");

    const rowsAfterDateSort = getBodyRows();
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

    await clickHeader("Expire date");
    const rowsAfterDateDescSort = getBodyRows();
    expect(
      within(rowsAfterDateDescSort[0]).getByRole("cell", {
        name: "Load Balancer 3",
      }),
    ).toHaveTextContent("Load Balancer 3");
    expect(
      within(rowsAfterDateDescSort[2]).getByRole("cell", {
        name: "Load Balancer 2",
      }),
    ).toHaveTextContent("Load Balancer 2");
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

    await clickHeader("Port");

    expect(getCell(0, 2)).toHaveTextContent("80");
    expect(getCell(1, 2)).toHaveTextContent("443");
    expect(getCell(2, 2)).toHaveTextContent("3000");
  });

  it("allows a header to opt into sorting when the table itself is not sortable", async () => {
    const customHeaders = [
      { key: "name", value: "Name", sort: true as const },
      { key: "protocol", value: "Protocol" },
    ];

    render(DataTable, {
      props: {
        sortable: false,
        headers: customHeaders,
        rows,
      },
    });

    // Protocol has no per-header override, so it stays non-interactive.
    expect(screen.getByText("Protocol").closest("th")).not.toHaveAttribute(
      "aria-sort",
    );

    // Name opted in via sort: true, so it renders as a sortable header and
    // can be clicked even though the table-level `sortable` is false.
    const nameHeader = screen.getByText("Name");
    expect(nameHeader.closest("th")).toHaveAttribute("aria-sort", "none");

    await user.click(nameHeader);

    expect(nameHeader.closest("th")).toHaveAttribute("aria-sort", "ascending");

    const tableRows = getBodyRows();
    expect(
      within(tableRows[0]).getByRole("cell", { name: "Load Balancer 1" }),
    ).toBeInTheDocument();
  });

  it("sortAlways: toggles between ascending and descending only", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        sortAlways: true,
        headers,
        rows,
      },
    });

    await clickHeader("Name");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 1");

    await clickHeader("Name");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 3");

    // Click 3: descending -> ascending (NOT back to none)
    await clickHeader("Name");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 1");
  });

  it("sortAlways: switches columns without resetting to none", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        sortAlways: true,
        headers,
        rows,
      },
    });

    await clickHeader("Name");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 1");

    await clickHeader("Port");
    expect(getCell(0, 2)).toHaveTextContent("80");
  });

  it("without sortAlways: third click resets to original order", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
      },
    });

    // Click 1: ascending
    await clickHeader("Name");
    // Click 2: descending
    await clickHeader("Name");
    // Click 3: none (original order)
    await clickHeader("Name");

    // Original order: Load Balancer 3, Load Balancer 1, Load Balancer 2
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 3");
  });

  it("sort: third click dispatches sort with key null and direction none", async () => {
    const sortHandler = vi.fn();
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
        onsort: sortHandler,
      },
    });

    await clickHeader("Name");
    await tick();
    await clickHeader("Name");
    await tick();
    await clickHeader("Name");
    await tick();

    expect(sortHandler).toHaveBeenCalledTimes(3);
    expect(sortHandler.mock.calls[0][0].detail).toEqual({
      key: "name",
      direction: "ascending",
    });
    expect(sortHandler.mock.calls[1][0].detail).toEqual({
      key: "name",
      direction: "descending",
    });
    expect(sortHandler.mock.calls[2][0].detail).toEqual({
      key: null,
      direction: "none",
    });
  });

  it("header.sortAlways overrides table: column with sortAlways: true stays sorted", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers: [
          { key: "name", value: "Name", sortAlways: true },
          { key: "protocol", value: "Protocol" },
          { key: "port", value: "Port", sortAlways: false },
        ],
        rows,
      },
    });

    // Name has sortAlways: true (override) – third click stays sorted
    await clickHeader("Name");
    await clickHeader("Name");
    await clickHeader("Name");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 1");

    // Port has sortAlways: false (override) – third click unsorts
    await clickHeader("Port");
    await clickHeader("Port");
    await clickHeader("Port");
    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 3");
  });

  it("header.sortAlways overrides table: column with sortAlways: false allows unsort when table has sortAlways: true", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        sortAlways: true,
        headers: [
          { key: "name", value: "Name" },
          { key: "port", value: "Port", sortAlways: false },
        ],
        rows,
      },
    });

    // Port has sortAlways: false – overrides table, third click unsorts
    await clickHeader("Port");
    await clickHeader("Port");
    await clickHeader("Port");

    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 3");
  });

  it("sorts using the top-level sort prop", async () => {
    const customRows = [
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

    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows: customRows,
        sort: (a: DataTableValue, b: DataTableValue) => {
          // Reverse alphabetical for strings, normal for numbers
          if (typeof a === "number" && typeof b === "number") return a - b;
          return String(b).localeCompare(String(a));
        },
      },
    });

    // Sort by name — should use the top-level sort (reverse alphabetical)
    await clickHeader("Name");

    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 3");
    expect(getCell(2, 0)).toHaveTextContent("Load Balancer 1");

    // Sort by port — should use the top-level sort (numeric)
    await clickHeader("Port");

    expect(getCell(0, 2)).toHaveTextContent("80");
    expect(getCell(2, 2)).toHaveTextContent("3000");
  });

  it("negates the top-level sort result for descending sortDirection", () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
        sortKey: "name",
        sortDirection: "descending",
        sort: (a: DataTableValue, b: DataTableValue) =>
          String(a).localeCompare(String(b)),
      },
    });

    expect(getColumnTexts(0)).toEqual([
      "Load Balancer 3",
      "Load Balancer 2",
      "Load Balancer 1",
    ]);
  });

  it("per-header sort overrides the top-level sort prop", async () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      {
        key: "port",
        value: "Port",
        sort: (a: DataTableValue, b: DataTableValue) =>
          (b as number) - (a as number), // descending when ascending
      },
      { key: "rule", value: "Rule" },
    ];

    const customRows = [
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

    // Top-level sort would sort numbers ascending, but header sort reverses port
    render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows: customRows,
        sort: (a: DataTableValue, b: DataTableValue) => {
          if (typeof a === "number" && typeof b === "number") return a - b;
          return String(a).localeCompare(String(b));
        },
      },
    });

    // Sort by name — should use the top-level sort (normal alphabetical)
    await clickHeader("Name");

    expect(getCell(0, 0)).toHaveTextContent("Load Balancer 1");
    expect(getCell(2, 0)).toHaveTextContent("Load Balancer 3");

    // Sort by port — should use per-header sort (descending when ascending)
    await clickHeader("Port");

    // Per-header sort reverses: ascending click → 3000 first
    expect(getCell(0, 2)).toHaveTextContent("3000");
    expect(getCell(2, 2)).toHaveTextContent("80");
  });

  it("calls top-level sort except where header.sort overrides", async () => {
    const tableSort = vi.fn((a: DataTableValue, b: DataTableValue) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
    const nameHeaderSort = vi.fn((a: DataTableValue, b: DataTableValue) =>
      String(a).localeCompare(String(b)),
    );

    const customHeaders = [
      { key: "name", value: "Name", sort: nameHeaderSort },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
    ];

    render(DataTable, {
      props: {
        sortable: true,
        headers: customHeaders,
        rows,
        sort: tableSort,
      },
    });

    await clickHeader("Port");
    expect(tableSort).toHaveBeenCalled();
    expect(nameHeaderSort).not.toHaveBeenCalled();

    tableSort.mockClear();
    nameHeaderSort.mockClear();

    await clickHeader("Name");
    expect(nameHeaderSort).toHaveBeenCalled();
    expect(tableSort).not.toHaveBeenCalled();
  });

  it("handles selectable rows", async () => {
    const { container } = render(DataTable, {
      props: {
        selectable: true,
        headers,
        rows,
      },
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(3);

    await user.click(checkboxes[0]);

    const selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).toBeInTheDocument();
  });

  it("handles shift+click range selection", async () => {
    render(DataTable, {
      props: {
        selectable: true,
        headers,
        rows,
      },
    });

    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[0]);

    await user.keyboard("{Shift>}");
    await user.click(checkboxes[2]);
    await user.keyboard("{/Shift}");

    // Every row between the anchor and the shift-clicked row is selected.
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();

    // Shift+click again to deselect the range back to the anchor.
    await user.keyboard("{Shift>}");
    await user.click(checkboxes[1]);
    await user.keyboard("{/Shift}");

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("does not range-select non-selectable rows on shift+click", async () => {
    render(DataTable, {
      props: {
        selectable: true,
        nonSelectableRowIds: ["b"],
        headers,
        rows,
      },
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);

    await user.click(checkboxes[0]);

    await user.keyboard("{Shift>}");
    await user.click(checkboxes[1]);
    await user.keyboard("{/Shift}");

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("handles batch selection", async () => {
    const { container } = render(DataTable, {
      props: {
        batchSelection: true,
        headers,
        rows,
      },
    });

    const batchCheckbox = screen.getByRole("checkbox", {
      name: /select all/i,
    });

    await user.click(batchCheckbox);

    const selectedRows = container.querySelectorAll(
      ".bx--data-table--selected",
    );
    expect(selectedRows.length).toBe(3);

    await user.click(batchCheckbox);

    const unselectedRows = container.querySelectorAll(
      ".bx--data-table--selected",
    );
    expect(unselectedRows.length).toBe(0);
  });

  it("ignores selected ids that are not rows in the select all state", () => {
    render(DataTable, {
      props: {
        batchSelection: true,
        headers,
        rows,
        selectedRowIds: ["a", "b", "zzz"],
      },
    });

    const selectAll = getSelectAll();
    expect(selectAll).toBePartiallyChecked();
    expect(selectAll).not.toBeChecked();
  });

  it("leaves the select all state to the native checkbox", async () => {
    render(DataTable, { props: { batchSelection: true, headers, rows: [] } });

    // With no rows to select, the click checks the box but never changes
    // the `checked` prop, so an `aria-checked` copy of it would go stale.
    const selectAll = getSelectAll();
    await user.click(selectAll);

    expect(selectAll).toBeChecked();
    expect(selectAll).not.toHaveAttribute("aria-checked");
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

  it("renders a selection header cell for radio batch selection", () => {
    const { container } = render(DataTable, {
      props: { radio: true, batchSelection: true, headers, rows },
    });

    const headerCells = container.querySelectorAll("thead th");
    const bodyCells = container.querySelectorAll("tbody tr:first-child td");
    expect(headerCells).toHaveLength(bodyCells.length);
    expect(
      screen.queryByRole("checkbox", { name: "Select all rows" }),
    ).not.toBeInTheDocument();
    expect(headerCells[0]).toHaveTextContent("Select row");
  });

  it("renders only the select all header cell for checkbox batch selection", () => {
    const { container } = render(DataTable, {
      props: { batchSelection: true, headers, rows },
    });

    expect(
      screen.getAllByRole("checkbox", { name: "Select all rows" }),
    ).toHaveLength(1);
    expect(container.querySelector("thead")).not.toHaveTextContent(
      "Select row",
    );
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

    const nonSelectableRow = container.querySelector("tr[data-row='b']");
    assert(nonSelectableRow instanceof HTMLTableRowElement);
    const nonSelectableCheckbox =
      within(nonSelectableRow).queryByRole("checkbox");
    expect(nonSelectableCheckbox).not.toBeInTheDocument();

    const nonExpandableRow = container.querySelector("tr[data-row='c']");
    assert(nonExpandableRow instanceof HTMLTableRowElement);
    const nonExpandableButton = within(nonExpandableRow).queryByRole("button", {
      name: /expand/i,
    });
    expect(nonExpandableButton).not.toBeInTheDocument();
  });

  it("handles expandable rows", async () => {
    const { container } = render(DataTable, {
      props: {
        expandable: true,
        headers,
        rows,
      },
    });

    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons.length).toBe(3);
    expect(expandButtons[0]).toHaveAttribute("aria-expanded", "false");

    await user.click(expandButtons[0]);

    const expandedRow = container.querySelector(".bx--expandable-row");
    expect(expandedRow).toBeInTheDocument();
    expect(expandedRow).toHaveClass("bx--expandable-row bx--parent-row");
    expect(expandButtons[0]).toHaveAttribute("aria-expanded", "true");
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
    expect(expandAllButton).toHaveAttribute("aria-expanded", "false");

    await user.click(expandAllButton);
    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(3);
    expect(expandAllButton).toHaveAttribute("aria-expanded", "true");

    await user.click(expandAllButton);
    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(0);
    expect(expandAllButton).toHaveAttribute("aria-expanded", "false");
  });

  it("reads expand all when no row is expandable", () => {
    render(DataTable, {
      props: {
        expandable: true,
        batchExpansion: true,
        headers,
        rows,
        nonExpandableRowIds: ["a", "b", "c"],
      },
    });

    const button = screen.getByLabelText("Expand all rows");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("reads expand all when there are no rows", () => {
    render(DataTable, {
      props: { expandable: true, batchExpansion: true, headers, rows: [] },
    });

    const button = screen.getByLabelText("Expand all rows");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores expanded ids that are not rows in the expand all state", async () => {
    const { container } = render(DataTable, {
      props: {
        expandable: true,
        batchExpansion: true,
        headers,
        rows,
        expandedRowIds: ["a", "b", "zzz"],
      },
    });

    await user.click(screen.getByLabelText("Expand all rows"));
    expect(
      container.querySelectorAll(".bx--child-row-inner-container"),
    ).toHaveLength(3);
    expect(screen.getByLabelText("Collapse all rows")).toBeInTheDocument();
  });

  it("reads collapse all when every row is expanded", () => {
    render(DataTable, {
      props: {
        expandable: true,
        batchExpansion: true,
        headers,
        rows,
        expandedRowIds: ["a", "b", "c"],
      },
    });

    const button = screen.getByLabelText("Collapse all rows");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
  it("sets aria-expanded on per-row expand buttons when virtualized", async () => {
    const largeRows = Array.from({ length: 150 }, (_, i) => ({
      id: String(i),
      name: `Load Balancer ${i + 1}`,
      protocol: "HTTP",
      port: 3000 + i,
      rule: "Round robin",
    }));

    render(DataTable, {
      props: {
        expandable: true,
        virtualize: true,
        headers,
        rows: largeRows,
      },
    });

    const [firstExpandButton] = screen.getAllByRole("button", {
      name: /expand/i,
    });
    expect(firstExpandButton).toHaveAttribute("aria-expanded", "false");

    await user.click(firstExpandButton);
    expect(firstExpandButton).toHaveAttribute("aria-expanded", "true");
  });

  it("renders custom expand icon via expandIcon slot", async () => {
    const { container } = render(DataTableExpandIcon);

    const customIcons = screen.getAllByTestId("custom-expand-icon");
    expect(customIcons.length).toBeGreaterThanOrEqual(2);

    const firstExpandButton = screen.getAllByRole("button", {
      name: /expand/i,
    })[0];
    expect(
      within(firstExpandButton).getByTestId("custom-expand-icon"),
    ).toHaveAttribute("data-expanded", "false");

    await user.click(firstExpandButton);

    expect(
      within(firstExpandButton).getByTestId("custom-expand-icon"),
    ).toHaveAttribute("data-expanded", "true");

    const expandedContent = container.querySelector(
      ".bx--child-row-inner-container",
    );
    expect(expandedContent).toBeInTheDocument();
  });

  it("should give the expand column an id referenced by every row's headers attribute", () => {
    const { container } = render(DataTableExpandIcon);

    const expandHeader = container.querySelector("th.bx--table-expand");
    expect(expandHeader).toHaveAttribute("id");

    const expandId = expandHeader?.getAttribute("id");
    const expandCells = container.querySelectorAll("td.bx--table-expand");
    expect(expandCells.length).toBeGreaterThan(0);
    for (const cell of expandCells) {
      expect(cell.getAttribute("headers")).toBe(expandId);
    }
  });

  it("applies zebra stripe styling", () => {
    render(DataTable, {
      props: {
        zebra: true,
        headers,
        rows,
      },
    });

    const table = screen.getByRole("table");
    expect(table).toHaveClass("bx--data-table--zebra");
  });

  it("stripes visible rows with data-zebra-even when filterMode is hide", async () => {
    const zebraRows = [
      { id: "a", name: "Row A", rule: "Round robin" },
      { id: "b", name: "Row B", rule: "DNS delegation" },
      { id: "c", name: "Row C", rule: "Round robin" },
      { id: "d", name: "Row D", rule: "Round robin" },
    ];
    render(DataTable, {
      props: {
        zebra: true,
        filterMode: "hide",
        search: true,
        headers,
        rows: zebraRows,
      },
    });

    await user.type(screen.getByRole("searchbox"), "round");

    expect(screen.getByRole("table")).not.toHaveClass("bx--data-table--zebra");
    expect(
      [...document.querySelectorAll("tr[data-zebra-even]")].map((tr) =>
        tr.getAttribute("data-row"),
      ),
    ).toEqual(["c"]);
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

      const table = screen.getByRole("table");
      expect(table).toHaveClass(expectedClass);
      unmount();
    }
  });

  it("uses empty header key when passed (nullish coalescing)", async () => {
    const onevent = vi.fn();
    const { container } = render(DataTable, {
      props: {
        onevent,
        headers: [
          { key: "", value: "Empty Key Col" },
          { key: "name", value: "Name" },
        ],
        rows: [
          { id: "a", name: "Row A" },
          { id: "b", name: "Row B" },
        ],
      },
    });

    const firstCell = container.querySelector("td");
    assert(firstCell);
    await user.click(firstCell);

    expect(eventDetails(onevent, "click:cell")).toEqual([
      expect.objectContaining({
        cell: expect.objectContaining({ key: "" }),
      }),
    ]);
  });

  it("applies custom column widths without forcing fixed layout", () => {
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

    // A single sized header no longer forces every other column to share
    // the remainder equally.
    const table = screen.getByRole("table");
    expect(table).not.toHaveStyle({ "table-layout": "fixed" });

    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(nameHeader).toHaveStyle({ width: "200px" });

    const protocolHeader = screen.getByRole("columnheader", {
      name: "Protocol",
    });
    expect(protocolHeader).toHaveStyle({ "min-width": "100px" });
  });

  // Regression: table-layout: fixed strictly enforces the expand column's
  // CSS width (32px), clipping the chevron that auto layout otherwise grows
  // to fit (40px). Pin the expand column width so it matches auto layout.
  it("marks the table fixed-layout when fixedLayout is set explicitly, so CSS can keep the expand column stable", () => {
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port", width: "72px" },
      { key: "rule", value: "Rule" },
    ] as const;

    render(DataTable, {
      props: {
        expandable: true,
        fixedLayout: true,
        headers: customHeaders,
        rows,
      },
    });

    const table = screen.getByRole("table");
    expect(table).toHaveClass("bx--data-table--fixed-layout");
    expect(table).toHaveStyle({ "table-layout": "fixed" });
  });

  describe("column alignment", () => {
    const alignedHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", columnAlign: "start" },
      { key: "port", value: "Port", columnAlign: "end" },
      { key: "rule", value: "Rule" },
    ] as const;

    it("aligns the header and every cell of an aligned column only", () => {
      render(DataTable, { props: { headers: alignedHeaders, rows } });

      const columnHeaders = screen.getAllByRole("columnheader");
      expect(columnHeaders[1]).toHaveClass("bx--table-column--align-start");
      expect(columnHeaders[2]).toHaveClass("bx--table-column--align-end");
      expect(columnHeaders[0].className).not.toMatch(/align/);
      expect(columnHeaders[3].className).not.toMatch(/align/);

      const bodyRows = getBodyRows();
      expect(bodyRows).toHaveLength(rows.length);

      for (const row of bodyRows) {
        const cells = getCells(row);
        expect(cells[1]).toHaveClass("bx--table-column--align-start");
        expect(cells[2]).toHaveClass("bx--table-column--align-end");
        expect(cells[0].className).not.toMatch(/align/);
        expect(cells[3].className).not.toMatch(/align/);
      }
    });

    it("keeps the sort affordance on an aligned sortable header", async () => {
      render(DataTable, {
        props: { headers: alignedHeaders, rows, sortable: true },
      });

      const portHeader = screen.getAllByRole("columnheader")[2];
      expect(portHeader).toHaveClass("bx--table-column--align-end");
      expect(portHeader).toHaveAttribute("aria-sort", "none");

      const sortButton = within(portHeader).getByRole("button");
      expect(sortButton).toHaveClass("bx--table-sort");

      await user.click(sortButton);
      expect(portHeader).toHaveAttribute("aria-sort", "ascending");
    });

    it("aligns virtualized rows but not spacer rows", () => {
      const largeRows = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        name: `Load Balancer ${i + 1}`,
        protocol: "HTTP",
        port: 3000 + i,
        rule: "Round robin",
      }));

      render(DataTable, {
        props: { headers: alignedHeaders, rows: largeRows, virtualize: true },
      });

      const isSpacer = (row: HTMLElement) =>
        row.getAttribute("style")?.includes("height:") ?? false;
      const bodyRows = getBodyRows();
      const dataRows = bodyRows.filter((row) => !isSpacer(row));
      const spacerRows = bodyRows.filter(isSpacer);

      expect(dataRows.length).toBeGreaterThan(0);
      expect(spacerRows.length).toBeGreaterThan(0);

      for (const row of dataRows) {
        const cells = getCells(row);
        expect(cells[1]).toHaveClass("bx--table-column--align-start");
        expect(cells[2]).toHaveClass("bx--table-column--align-end");
      }

      for (const row of spacerRows) {
        for (const cell of getCells(row)) {
          expect(cell.className).not.toMatch(/align/);
        }
      }
    });
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

  describe("stickyHeaderMaxHeight", () => {
    it("sets a pixel cap when stickyHeader is enabled", () => {
      const { container } = render(DataTable, {
        props: {
          headers,
          rows,
          stickyHeader: true,
          stickyHeaderMaxHeight: 500,
        },
      });

      const innerContainer = container.querySelector(
        "section.bx--data-table_inner-container",
      );
      // A custom property, not `max-height`, so a print rule can lift the cap.
      expectInlineStyle(innerContainer, {
        "--ccs-sticky-header-max-height": "500px",
      });
      expect((innerContainer as HTMLElement).style.maxHeight).toBe("");
    });

    it("sets a CSS length string cap when stickyHeader is enabled", () => {
      const { container } = render(DataTable, {
        props: {
          headers,
          rows,
          stickyHeader: true,
          stickyHeaderMaxHeight: "24rem",
        },
      });

      const innerContainer = container.querySelector(
        "section.bx--data-table_inner-container",
      );
      expectInlineStyle(innerContainer, {
        "--ccs-sticky-header-max-height": "24rem",
      });
    });
  });

  describe("horizontal scroll wrapper", () => {
    it("wraps the table in a bx--data-table-content element", () => {
      render(DataTable, { props: { headers, rows } });

      const table = screen.getByRole("table");
      const wrapper = table.parentElement;
      expect(wrapper).toHaveClass("bx--data-table-content");
      expect(wrapper).not.toHaveAttribute("tabindex");
    });

    it("does not add the wrapper when stickyHeader is enabled", () => {
      const { container } = render(DataTable, {
        props: { headers, rows, stickyHeader: true },
      });

      expect(
        container.querySelector(".bx--data-table-content"),
      ).not.toBeInTheDocument();
    });
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

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells.length).toBe(5); // 4 regular headers + 1 empty column
    expect(headerCells[4]).toHaveTextContent("");

    const tableRows = getBodyRows();
    for (const row of tableRows) {
      const cells = getCells(row);
      expect(cells.length).toBe(5);
    }
  });

  describe("empty header name", () => {
    it.each([
      ["a plain header", false],
      ["a columnMenu header", true],
    ])("names %s with its value, visually hidden", (_, columnMenu) => {
      const emptyHeaders = [
        { key: "name", value: "Name" },
        { key: "actions", value: "Actions", empty: true, columnMenu },
      ] as const;

      render(DataTable, {
        props: { headers: emptyHeaders, rows, sortable: true },
      });

      const header = screen.getByRole("columnheader", { name: "Actions" });
      expect(within(header).getByText("Actions")).toHaveClass(
        "bx--visually-hidden",
      );
      // The value names the column but does not make it sortable.
      expect(screen.getByRole("button", { name: /Name/ })).toBeInTheDocument();
      expect(within(header).queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("empty column alignment in sticky header", () => {
    const stickyHeaders = [
      { key: "name", value: "Name" },
      { key: "actions", value: "", empty: true },
    ] as const;

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/440
    it("renders a non-empty label wrapper for a plain empty header so it flexes like its body cells", () => {
      render(DataTable, {
        props: { headers: stickyHeaders, rows, stickyHeader: true },
      });

      const emptyHeader = screen.getAllByRole("columnheader")[1];
      // A label wrapper keeps the <th> from matching `:empty`, so it escapes
      // Carbon's `th:empty { max-width: 2.25rem }` cap and flexes full width.
      expect(emptyHeader.matches(":empty")).toBe(false);
      expect(
        emptyHeader.querySelector(".bx--table-header-label"),
      ).toBeInTheDocument();
      expect(emptyHeader).not.toHaveClass("bx--table-column-menu");
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1492
    it("pairs a columnMenu empty header and its body cells via the table-column-menu class", () => {
      const columnMenuHeaders = [
        { key: "name", value: "Name" },
        { key: "actions", value: "", empty: true, columnMenu: true },
      ] as const;

      const { container } = render(DataTable, {
        props: { headers: columnMenuHeaders, rows, stickyHeader: true },
      });

      // The header stays truly empty, so Carbon's `th:empty` cap keeps it
      // narrow, and carries the class so the sticky-header rule can match
      // it...
      const emptyHeader = screen.getAllByRole("columnheader")[1];
      expect(emptyHeader.matches(":empty")).toBe(true);
      expect(emptyHeader).toHaveClass("bx--table-column-menu");

      // ...and every body cell in that column carries the same class, so head
      // and body widths are paired and stay aligned.
      const bodyCells = container.querySelectorAll(
        "tbody td.bx--table-column-menu",
      );
      expect(bodyCells.length).toBe(rows.length);
    });
  });

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

    const firstPageRows = getBodyRows();
    expect(firstPageRows.length).toBe(5);
    expect(
      within(firstPageRows[0]).getByRole("cell", { name: "Load Balancer 1" }),
    ).toHaveTextContent("Load Balancer 1");
    expect(
      within(firstPageRows[4]).getByRole("cell", { name: "Load Balancer 5" }),
    ).toHaveTextContent("Load Balancer 5");

    await rerender({ headers, rows: paginatedRows, pageSize: 5, page: 2 });

    const secondPageRows = getBodyRows();
    expect(secondPageRows.length).toBe(5);
    expect(
      within(secondPageRows[0]).getByRole("cell", { name: "Load Balancer 6" }),
    ).toHaveTextContent("Load Balancer 6");
    expect(
      within(secondPageRows[4]).getByRole("cell", { name: "Load Balancer 10" }),
    ).toHaveTextContent("Load Balancer 10");

    await rerender({ page: 3 });

    const thirdPageRows = getBodyRows();
    expect(thirdPageRows.length).toBe(5);
    expect(
      within(thirdPageRows[0]).getByRole("cell", { name: "Load Balancer 11" }),
    ).toHaveTextContent("Load Balancer 11");
    expect(
      within(thirdPageRows[4]).getByRole("cell", { name: "Load Balancer 15" }),
    ).toHaveTextContent("Load Balancer 15");
  });

  it("sorts all rows before slicing the page", () => {
    const sortedPortRows = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      name: `Load Balancer ${i + 1}`,
      protocol: "HTTP",
      port: (15 - i) * 10,
      rule: "Round robin",
    }));

    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows: sortedPortRows,
        sortKey: "port",
        sortDirection: "ascending",
        pageSize: 5,
        page: 1,
      },
    });

    expect(getColumnTexts(2)).toEqual(["10", "20", "30", "40", "50"]);
  });

  it("dispatches cell events before row events on a cell click", async () => {
    const onevent = vi.fn();
    render(DataTable, { props: { headers, rows, onevent } });

    await user.click(getCell(0, 0));

    expect(eventNames(onevent, "click")).toEqual([
      "click",
      "click:cell",
      "click",
      "click:row",
    ]);
    const [cellClick, rowClick] = eventDetails(onevent, "click");
    expect(cellClick).toEqual(
      expect.objectContaining({ cell: expect.any(Object) }),
    );
    expect(rowClick).not.toHaveProperty("cell");
  });

  it("handles row hover events", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: {
        headers,
        rows,
        onevent,
      },
    });

    const tableRows = getBodyRows();
    const firstRow = tableRows[0];
    await user.hover(firstRow);
    await user.unhover(firstRow);

    expect(eventNames(onevent, "mouse")).toEqual([
      "mouseenter:row",
      "mouseleave:row",
    ]);
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

  it("passes row, cell and header to the cell, cellHeader and expandedRow slots", () => {
    render(DataTableSlotProps);

    expect(
      screen.getAllByTestId("header-slot").map((el) => el.textContent),
    ).toEqual(["name=Name", "port=Port"]);
    expect(
      screen.getAllByTestId("cell-slot").map((el) => el.textContent),
    ).toEqual([
      "a.name=Load Balancer 1",
      "a.port=3000",
      "b.name=Load Balancer 2",
      "b.port=443",
    ]);
    expect(screen.getByTestId("expanded-slot")).toHaveTextContent(
      "b=Load Balancer 2",
    );
  });

  it("passes rowSelected prop to expandedRow slot", () => {
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

    const row = container.querySelector("tr[data-row='a']");
    expect(row).toHaveClass("bx--data-table--selected");
    expect(row).toHaveClass("bx--expandable-row");

    const expandedContent = container.querySelector(
      "[id$='-expandable-row-a'] .bx--child-row-inner-container",
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

    let selectedRow = container.querySelector(".bx--data-table--selected");
    expect(selectedRow).not.toBeInTheDocument();

    await rerender({ selectedRowIds: ["a"] });

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

    let expandedContent = container.querySelector(
      ".bx--child-row-inner-container",
    );
    expect(expandedContent).not.toBeInTheDocument();

    await rerender({ expandedRowIds: ["a"] });

    expandedContent = container.querySelector(
      "[id$='-expandable-row-a'] .bx--child-row-inner-container",
    );
    expect(expandedContent).toBeInTheDocument();
  });

  it("includes target and currentTarget in click:row event", async () => {
    const onevent = vi.fn();
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
        onevent,
      },
    });

    const firstRow = container.querySelector("tbody tr");
    assert(firstRow);
    await user.click(firstRow);

    expect(eventDetails(onevent, "click:row")).toEqual([
      {
        row: expect.objectContaining({ id: "a" }),
        target: expect.any(HTMLElement),
        currentTarget: expect.any(HTMLElement),
      },
    ]);
  });

  it("includes target and currentTarget in click:cell event", async () => {
    const onevent = vi.fn();
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
        onevent,
      },
    });

    const firstCell = container.querySelector("td");
    assert(firstCell);
    await user.click(firstCell);

    expect(eventDetails(onevent, "click:cell")).toEqual([
      {
        cell: expect.objectContaining({ key: "name" }),
        target: expect.any(HTMLElement),
        currentTarget: expect.any(HTMLElement),
      },
    ]);
  });

  it("includes target and currentTarget in click:header event", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: {
        headers,
        rows,
        sortable: true,
        onevent,
      },
    });

    await clickHeader("Name");

    expect(eventDetails(onevent, "click:header")).toEqual([
      {
        header: expect.objectContaining({ key: "name" }),
        sortDirection: "ascending",
        target: expect.any(HTMLElement),
        currentTarget: expect.any(HTMLElement),
      },
    ]);
  });

  it("includes target and currentTarget when clicking non-sortable header", async () => {
    const onevent = vi.fn();
    const customHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", sort: false as const },
    ];

    render(DataTable, {
      props: {
        headers: customHeaders,
        rows,
        sortable: true,
        onevent,
      },
    });

    await clickHeader("Protocol");

    // toEqual treats a missing key as undefined, so this also checks that
    // no sortDirection is reported for a non-sortable header.
    expect(eventDetails(onevent, "click:header")).toEqual([
      {
        header: expect.objectContaining({ key: "protocol" }),
        target: expect.any(HTMLElement),
        currentTarget: expect.any(HTMLElement),
      },
    ]);
  });

  describe("selection and expansion event payloads", () => {
    it("click:row--select reports the row and its new selected state", async () => {
      const onevent = vi.fn();
      render(DataTable, {
        props: { selectable: true, headers, rows, onevent },
      });

      await user.click(getRowInputs()[1]);
      await user.click(getRowInputs()[1]);

      expect(eventDetails(onevent, "click:row--select")).toEqual([
        { row: rows[1], selected: true },
        { row: rows[1], selected: false },
      ]);
    });

    it("click:row--expand reports the row and its new expanded state", async () => {
      const onevent = vi.fn();
      render(DataTable, {
        props: { expandable: true, headers, rows, onevent },
      });

      await user.click(
        screen.getAllByRole("button", { name: /expand current row/i })[2],
      );
      await user.click(
        screen.getAllByRole("button", { name: /collapse current row/i })[0],
      );

      expect(eventDetails(onevent, "click:row--expand")).toEqual([
        { row: rows[2], expanded: true },
        { row: rows[2], expanded: false },
      ]);
    });

    it("click:header--expand reports the new expanded state", async () => {
      const onevent = vi.fn();
      render(DataTable, {
        props: {
          expandable: true,
          batchExpansion: true,
          headers,
          rows,
          onevent,
        },
      });

      await user.click(screen.getByRole("button", { name: "Expand all rows" }));
      await user.click(
        screen.getByRole("button", { name: "Collapse all rows" }),
      );

      expect(eventDetails(onevent, "click:header--expand")).toEqual([
        { expanded: true },
        { expanded: false },
      ]);
    });

    it("click:header--select reports indeterminate and selected", async () => {
      const onevent = vi.fn();
      render(DataTable, {
        props: {
          selectable: true,
          batchSelection: true,
          selectedRowIds: ["a"],
          headers,
          rows,
          onevent,
        },
      });

      await user.click(getSelectAll());
      await user.click(getSelectAll());

      expect(eventDetails(onevent, "click:header--select")).toEqual([
        { indeterminate: true, selected: false },
        { indeterminate: false, selected: true },
      ]);
    });
  });

  it("does not dispatch click:row when clicking checkbox", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: {
        selectable: true,
        headers,
        rows,
        onevent,
      },
    });

    await user.click(screen.getAllByRole("checkbox")[0]);

    expect(eventDetails(onevent, "click:row")).toEqual([]);
  });

  it("does not dispatch click:row when clicking radio button", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: {
        selectable: true,
        radio: true,
        headers,
        rows,
        onevent,
      },
    });

    await user.click(screen.getAllByRole("radio")[0]);

    expect(eventDetails(onevent, "click:row")).toEqual([]);
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
    it("lets an empty header set columnAlign", () => {
      // The assertion is the annotation: an inline literal gets excess
      // property checks, which reject an unknown `columnAlign`.
      const headers: ComponentProps<DataTableComponent>["headers"] = [
        { key: "actions", empty: true, columnAlign: "end" },
      ];

      expect(headers).toHaveLength(1);
    });

    it("lets sortKey be null to clear the sort", () => {
      type Props = ComponentProps<DataTableComponent<{ id: string }>>;

      expectTypeOf<null>().toExtend<Props["sortKey"]>();
      expectTypeOf<"id">().toExtend<Props["sortKey"]>();
    });

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

    it("sort prop types comparator args from the row generic", () => {
      type Row = {
        id: string;
        name: string;
        port: number;
        active: boolean;
      };

      type Props = ComponentProps<DataTableComponent<Row>>;
      type SortFn = NonNullable<Props["sort"]>;

      expectTypeOf<Parameters<SortFn>[0]>().toEqualTypeOf<
        DataTableSortValue<Row>
      >();
      expectTypeOf<Parameters<SortFn>[1]>().toEqualTypeOf<
        DataTableSortValue<Row>
      >();
      expectTypeOf<DataTableSortValue<Row>>().toEqualTypeOf<
        string | number | boolean
      >();
      expectTypeOf<Parameters<SortFn>[2]>().toEqualTypeOf<{
        key: DataTableKey<Row>;
        ascending: boolean;
        row_a: Row;
        row_b: Row;
      }>();
    });

    it("DataTableValueAtPath narrows nested keys for sort-related typing", () => {
      type NestedRow = {
        id: string;
        user: { name: string };
        port: number;
      };

      expectTypeOf<
        DataTableValueAtPath<NestedRow, "id">
      >().toEqualTypeOf<string>();
      expectTypeOf<
        DataTableValueAtPath<NestedRow, "user.name">
      >().toEqualTypeOf<string>();
      expectTypeOf<
        DataTableValueAtPath<NestedRow, "port">
      >().toEqualTypeOf<number>();

      type Props = ComponentProps<DataTableComponent<NestedRow>>;
      type SortFn = NonNullable<Props["sort"]>;
      expectTypeOf<Parameters<SortFn>[0]>().toEqualTypeOf<
        DataTableSortValue<NestedRow>
      >();
      expectTypeOf<DataTableSortValue<NestedRow>>().toEqualTypeOf<
        string | number | { name: string }
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

      const validHeaders: Headers = [
        { key: "id", value: "ID" },
        { key: "user.name", value: "Name" },
        { key: "contact.company", value: "Company" },
      ] as const;

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

      type CellKey = ClickCellEventDetail["cell"]["key"];
      type ExpectedCellKey = DataTableKey<NestedRow> | (string & {});

      expectTypeOf<CellKey>().toEqualTypeOf<ExpectedCellKey>();

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

      expectTypeOf<RowId>().toEqualTypeOf<"row-1" | "row-2" | "row-3">();

      type Props = ComponentProps<DataTableComponent<Row>>;
      expectTypeOf<NonNullable<Props["selectedRowIds"]>>().toEqualTypeOf<
        readonly ("row-1" | "row-2" | "row-3")[]
      >();
    });

    it("should support DataTableRow<Id> generic interface", () => {
      type StringDataTableRow = DataTableRow<string>;
      expectTypeOf<StringDataTableRow["id"]>().toEqualTypeOf<string>();

      type NumberDataTableRow = DataTableRow<number>;
      expectTypeOf<NumberDataTableRow["id"]>().toEqualTypeOf<number>();

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

        await rerender({ selectedRowIds: ["b"] });

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

    describe("cellClass prop", () => {
      it("applies a string cellClass to data cells only", () => {
        const { container } = render(DataTable, {
          props: {
            selectable: true,
            expandable: true,
            headers,
            rows,
            cellClass: "custom-cell-class",
          },
        });

        const dataCells = container.querySelectorAll(
          "tbody td.custom-cell-class",
        );
        expect(dataCells).toHaveLength(rows.length * headers.length);

        for (const cell of container.querySelectorAll(
          "tbody td.bx--table-expand, tbody td.bx--table-column-checkbox",
        )) {
          expect(cell).not.toHaveClass("custom-cell-class");
        }
        expect(container.querySelector("thead .custom-cell-class")).toBeNull();
      });

      it("marks every body cell it renders with bx--table-cell", () => {
        const { container } = render(DataTable, {
          props: {
            selectable: true,
            expandable: true,
            headers,
            rows,
            expandedRowIds: [rows[0].id],
          },
        });

        const cells = [...container.querySelectorAll("tbody td")];
        expect(cells.length).toBeGreaterThan(rows.length * headers.length);
        for (const cell of cells) {
          expect(cell).toHaveClass("bx--table-cell");
        }
      });

      it("passes row, cell, and state to a function cellClass", () => {
        const cellClass = vi.fn(
          ({ row, cell }: { row: { id: string }; cell: { key: string } }) =>
            row.id === "b" && cell.key === "port" ? "target-cell" : undefined,
        );
        const { container } = render(DataTable, {
          props: { headers, rows, cellClass },
        });

        expect(cellClass).toHaveBeenCalledWith(
          expect.objectContaining({
            row: expect.objectContaining({ id: "a" }),
            cell: expect.objectContaining({ key: "port" }),
            rowIndex: 0,
            cellIndex: 2,
            selected: false,
            expanded: false,
          }),
        );

        const targets = container.querySelectorAll(".target-cell");
        expect(targets).toHaveLength(1);
        expect(targets[0]).toHaveTextContent(String(rows[1].port));
      });

      it("combines with columnAlign without an undefined token", () => {
        const { container } = render(DataTable, {
          props: {
            headers: [
              { key: "name", value: "Name" },
              { key: "port", value: "Port", columnAlign: "end" },
            ],
            rows,
            cellClass: ({ cell }: { cell: { key: string } }) =>
              cell.key === "port" ? "port-cell" : undefined,
          },
        });

        const portCell = container.querySelector("tbody td.port-cell");
        assert(portCell);
        expect(portCell).toHaveClass("bx--table-column--align-end");

        for (const td of container.querySelectorAll("tbody td")) {
          expect(td.className).not.toContain("undefined");
        }
        const nameCell = container.querySelector("tbody td:not(.port-cell)");
        assert(nameCell);
        expect(nameCell.className).not.toContain("port-cell");
      });

      it("updates when selectedRowIds changes", async () => {
        const { container, rerender } = render(DataTable, {
          props: {
            selectable: true,
            headers,
            rows,
            selectedRowIds: ["a"],
            cellClass: ({ selected }: { selected: boolean }) =>
              selected ? "selected-cell" : undefined,
          },
        });

        const cellsOf = (id: string) =>
          container.querySelectorAll(`tr[data-row='${id}'] td.selected-cell`);
        expect(cellsOf("a")).toHaveLength(headers.length);
        expect(cellsOf("b")).toHaveLength(0);

        rerender({ selectedRowIds: ["b"] });
        await tick();

        expect(cellsOf("a")).toHaveLength(0);
        expect(cellsOf("b")).toHaveLength(headers.length);
      });

      it("applies to painted rows when virtualized", () => {
        const largeRows = Array.from({ length: 500 }, (_, i) => ({
          id: String(i),
          name: `Load Balancer ${i + 1}`,
          protocol: "HTTP",
          port: 3000 + i,
          rule: "Round robin",
        }));

        render(DataTable, {
          props: {
            headers,
            rows: largeRows,
            virtualize: true,
            cellClass: "virtual-cell",
          },
        });

        const isSpacer = (row: HTMLElement) =>
          row.getAttribute("style")?.includes("height:") ?? false;
        const dataRows = getBodyRows().filter((row) => !isSpacer(row));

        expect(dataRows.length).toBeGreaterThan(0);
        for (const row of dataRows) {
          for (const cell of within(row).getAllByRole("cell")) {
            expect(cell).toHaveClass("virtual-cell");
          }
        }
      });
    });
  });

  it("scopes the per-header data-header attribute to the DataTable instance to prevent collisions across multiple tables", () => {
    const { container: container1 } = render(DataTable, {
      props: { headers, rows },
    });
    const { container: container2 } = render(DataTable, {
      props: { headers, rows },
    });

    const headerKeys1 = Array.from(
      container1.querySelectorAll<HTMLElement>("th[data-header]"),
    ).map((th) => th.getAttribute("data-header"));
    const headerKeys2 = Array.from(
      container2.querySelectorAll<HTMLElement>("th[data-header]"),
    ).map((th) => th.getAttribute("data-header"));

    expect(headerKeys1).toHaveLength(headers.length);
    expect(headerKeys2).toHaveLength(headers.length);

    for (const header of headers) {
      expect(headerKeys1).not.toContain(header.key);
      expect(headerKeys2).not.toContain(header.key);
      expect(headerKeys1.some((key) => key?.endsWith(`-${header.key}`))).toBe(
        true,
      );
      expect(headerKeys2.some((key) => key?.endsWith(`-${header.key}`))).toBe(
        true,
      );
    }

    const overlap = headerKeys1.filter((key) => headerKeys2.includes(key));
    expect(overlap).toHaveLength(0);
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

      // When not using sticky header, the scroll container (table's
      // grandparent — the parent is Table's own `bx--data-table-content`
      // horizontal-scroll wrapper) has max-height
      const scrollContainer = table.parentElement?.parentElement;
      if (
        scrollContainer &&
        !container.querySelector(".bx--data-table_inner-container")
      ) {
        const scrollStyle = scrollContainer.getAttribute("style") ?? "";
        expect(scrollStyle).toContain("max-height");
        // Default: itemHeight 48 * maxVisibleRows 10 = 480px
        expect(scrollStyle).toContain("480px");
      }

      const tableRows = getBodyRows();
      expect(tableRows.length).toBeGreaterThan(0);
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

      const tableRows = getBodyRows();
      expect(tableRows.length).toBe(50);
    });

    it("caps the rendered rows at virtualize.maxItems", () => {
      render(DataTable, {
        props: {
          headers,
          rows: createLargeRowList(500),
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 5,
          },
        },
      });

      // Without `maxItems`: 400 / 50 + 5 overscan = 13 rows.
      expect(getRenderedRowIds()).toHaveLength(5);
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

    it("sorts the full row list when virtualized", () => {
      render(DataTable, {
        props: {
          headers,
          rows: createLargeRowList(500),
          sortable: true,
          sortKey: "port",
          sortDirection: "descending",
          virtualize: true,
        },
      });

      // Unsorted, the first row is "Load Balancer 1" (lowest port).
      const dataRows = document.querySelectorAll("tbody tr[data-row]");
      expect(dataRows[0]).toHaveTextContent("Load Balancer 500");
      expect(screen.queryByText("Load Balancer 1")).not.toBeInTheDocument();
    });

    it("should not re-attach scroll listener on unrelated state changes", async () => {
      const largeRows = createLargeRowList(500);
      const { rerender } = render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          stickyHeader: true,
          selectable: true,
          virtualize: true,
        },
      });

      await tick();

      // The scroll listener goes on the <table> inside the sticky <section>.
      const scrollTable = document.querySelector("table");
      expect(scrollTable).toBeInstanceOf(HTMLElement);
      assert(scrollTable instanceof HTMLElement);

      // Scroll listener should already be attached after initial render
      const addSpy = vi.spyOn(scrollTable, "addEventListener");

      // Trigger an unrelated state change (selecting a row)
      await rerender({ selectedRowIds: ["0"] });

      // With the old afterUpdate approach, addEventListener("scroll") would be
      // called again here because afterUpdate fires on every reactive update.
      // With the reactive $: block, it should NOT re-attach because none of
      // virtualConfig, stickyHeader, tableRef, or calculatedContainerHeight changed.
      const scrollCalls = addSpy.mock.calls.filter(
        ([event]) => event === "scroll",
      );
      expect(scrollCalls).toHaveLength(0);

      addSpy.mockRestore();
    });

    it("should ignore pagination when virtualized", () => {
      render(DataTable, {
        props: {
          headers,
          rows: createLargeRowList(500),
          pageSize: 10,
          page: 1,
          virtualize: true,
        },
      });

      // 480px / 48px = 10 visible rows + 3 overscan. Paginating would give 10.
      expect(getRenderedRowIds()).toHaveLength(13);
    });

    it("renders newly painted cell values after virtualized scroll", async () => {
      const largeRows = Array.from({ length: 200 }, (_, i) => ({
        id: String(i),
        name: `Load Balancer ${i + 1}`,
        protocol: "HTTP",
        port: 3000,
        rule: "Round robin",
      }));

      render(DataTable, {
        props: {
          headers,
          rows: largeRows,
          virtualize: {
            itemHeight: 48,
            maxVisibleRows: 10,
            overscan: 3,
            threshold: 100,
          },
          stickyHeader: false,
        },
      });

      await tick();
      expect(screen.getByText("Load Balancer 1")).toBeInTheDocument();

      const table = screen.getByRole("table");
      const scrollContainer = table.parentElement?.parentElement;
      assert(scrollContainer instanceof HTMLElement);
      scrollContainer.scrollTop = 48 * 40;
      scrollContainer.dispatchEvent(new Event("scroll"));
      await tick();

      expect(screen.queryByText("Load Balancer 1")).not.toBeInTheDocument();
      expect(screen.getByText("Load Balancer 38")).toBeInTheDocument();
    });
  });

  describe("footer", () => {
    const footerHeaders = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
    ] as const;

    it("should not render a tfoot without the footerCell slot", () => {
      const { container } = render(DataTableFooter, {
        props: { withFooter: false },
      });

      expect(container.querySelector("tfoot")).not.toBeInTheDocument();
    });

    it("should render one footer cell per column, in header order", () => {
      const { container } = render(DataTableFooter);

      const tfoot = container.querySelector("tfoot");
      assert(tfoot);

      const cells = tfoot.querySelectorAll("td");
      expect(cells).toHaveLength(footerHeaders.length);
      expect(within(tfoot).getByText("Total")).toBeInTheDocument();
      expect(cells[0]).toHaveTextContent("Total");
      expect(cells[1]).toHaveTextContent("");
      expect(cells[2]).toHaveTextContent("3523");
    });

    it("should pass each header to the slot", () => {
      const { container } = render(DataTableFooter, {
        props: {
          headers: [
            { key: "port", value: "Port" },
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol" },
          ],
        },
      });

      const cells = container.querySelectorAll("tfoot td");
      // "port" moved first, so the total follows it rather than the column index.
      expect(cells[0]).toHaveTextContent("3523");
      expect(cells[1]).toHaveTextContent("");
      expect(cells[2]).toHaveTextContent("");
    });

    it("should emit leading cells matching the header row", () => {
      const { container } = render(DataTableFooter, {
        props: { expandable: true, selectable: true },
      });

      const headerCells = container.querySelectorAll("thead tr th");
      const footerCells = container.querySelectorAll("tfoot td");
      expect(footerCells).toHaveLength(headerCells.length);
      expect(footerCells).toHaveLength(footerHeaders.length + 2);

      expect(footerCells[0]).toHaveClass("bx--table-expand");
      expect(footerCells[0]).toHaveAttribute("aria-hidden", "true");
      expect(footerCells[1]).toHaveClass("bx--table-column-checkbox");
      expect(footerCells[1]).toHaveAttribute("aria-hidden", "true");
    });

    it("should skip hidden columns", () => {
      const { container } = render(DataTableFooter, {
        props: {
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol", columnHidden: true },
            { key: "port", value: "Port" },
          ],
        },
      });

      const headerCells = container.querySelectorAll("thead th");
      const cells = container.querySelectorAll("tfoot td");
      expect(cells).toHaveLength(2);
      expect(cells).toHaveLength(headerCells.length);
      expect(cells[0]).toHaveTextContent("Total");
      expect(cells[1]).toHaveTextContent("3523");
    });

    it("should pass the visible column index when the first column is hidden", () => {
      const { container } = render(DataTableFooter, {
        props: {
          headers: [
            { key: "name", value: "Name", columnHidden: true },
            { key: "protocol", value: "Protocol" },
            { key: "port", value: "Port" },
          ],
        },
      });

      const cells = container.querySelectorAll("tfoot td");
      expect(cells).toHaveLength(2);
      expect(cells[0]).toHaveTextContent("Total");
      expect(cells[1]).toHaveTextContent("3523");
    });

    it("should match the header row with hidden columns and leading cells", () => {
      const { container } = render(DataTableFooter, {
        props: {
          expandable: true,
          selectable: true,
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol", columnHidden: true },
            { key: "port", value: "Port" },
          ],
        },
      });

      const headerCells = container.querySelectorAll("thead tr th");
      const footerCells = container.querySelectorAll("tfoot td");
      expect(headerCells).toHaveLength(4);
      expect(footerCells).toHaveLength(headerCells.length);
    });

    it("should apply the end alignment class to the column's footer cell", () => {
      const { container } = render(DataTableFooter, {
        props: {
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol" },
            { key: "port", value: "Port", columnAlign: "end" },
          ],
        },
      });

      const cells = container.querySelectorAll("tfoot td");
      expect(cells[2]).toHaveTextContent("3523");
      expect(cells[2]).toHaveClass("bx--table-column--align-end");
      expect(cells[0]).not.toHaveClass("bx--table-column--align-end");
      expect(cells[1]).not.toHaveClass("bx--table-column--align-end");
    });

    it("should apply the start alignment class to the column's footer cell", () => {
      const { container } = render(DataTableFooter, {
        props: {
          headers: [
            { key: "name", value: "Name", columnAlign: "start" },
            { key: "protocol", value: "Protocol" },
            { key: "port", value: "Port" },
          ],
        },
      });

      const cells = container.querySelectorAll("tfoot td");
      expect(cells[0]).toHaveClass("bx--table-column--align-start");
    });

    it("should leave the leading footer cells unaligned", () => {
      const { container } = render(DataTableFooter, {
        props: {
          expandable: true,
          selectable: true,
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol" },
            { key: "port", value: "Port", columnAlign: "end" },
          ],
        },
      });

      const cells = container.querySelectorAll("tfoot td");
      expect(cells[0]).toHaveClass("bx--table-expand");
      expect(cells[0]).not.toHaveClass("bx--table-column--align-end");
      expect(cells[1]).toHaveClass("bx--table-column-checkbox");
      expect(cells[1]).not.toHaveClass("bx--table-column--align-end");
      expect(cells[cells.length - 1]).toHaveClass(
        "bx--table-column--align-end",
      );
    });

    it("should render once while virtualized rows scroll", () => {
      const largeRows = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        name: `Load Balancer ${i + 1}`,
        protocol: "HTTP",
        port: 1,
      }));

      const { container } = render(DataTableFooter, {
        props: { rows: largeRows, virtualize: true },
      });

      const footers = container.querySelectorAll("tfoot");
      expect(footers).toHaveLength(1);

      const spacerRows = [...container.querySelectorAll("tbody tr")].filter(
        (row) => row.getAttribute("style")?.includes("height:"),
      );
      expect(spacerRows.length).toBeGreaterThan(0);
      for (const spacerRow of spacerRows) {
        expect(spacerRow.closest("tfoot")).toBeNull();
      }

      const cells = container.querySelectorAll("tfoot td");
      expect(cells).toHaveLength(footerHeaders.length);
      expect(cells[2]).toHaveTextContent(String(largeRows.length));
    });
  });

  describe("hidden columns", () => {
    const headersWithHiddenProtocol = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol", columnHidden: true },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
    ];

    it("renders no header or body cells for a hidden column", () => {
      render(DataTable, {
        props: { headers: headersWithHiddenProtocol, rows },
      });

      expect(getColumnHeaderText()).toEqual(["Name", "Port", "Rule"]);
      expect(screen.queryByText("Protocol")).not.toBeInTheDocument();
      expect(screen.queryByText("HTTP")).not.toBeInTheDocument();

      const bodyRows = getBodyRows();
      expect(bodyRows).toHaveLength(3);
      bodyRows.forEach((row, index) => {
        expect(getRowTexts(row)).toEqual([
          rows[index].name,
          String(rows[index].port),
          rows[index].rule,
        ]);
      });
    });

    it("sizes the expanded row to the visible column count", async () => {
      const { container, rerender } = render(DataTable, {
        props: {
          headers: headersWithHiddenProtocol,
          rows,
          expandable: true,
          expandedRowIds: ["a"],
        },
      });

      const getExpandedCell = () =>
        container.querySelector("tr[data-child-row] td");

      // 3 visible columns + the expand column.
      expect(getExpandedCell()).toHaveAttribute("colspan", "4");

      await rerender({ selectable: true });

      expect(getExpandedCell()).toHaveAttribute("colspan", "5");
    });

    it("excludes hidden columns from toolbar search", async () => {
      render(ToolbarSearchHost, {
        props: {
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol" },
            { key: "rule", value: "Rule", columnHidden: true },
          ],
          rows: [
            {
              id: "a",
              name: "Load Balancer 3",
              protocol: "HTTP",
              rule: "Round robin",
            },
            {
              id: "b",
              name: "Load Balancer 1",
              protocol: "HTTP",
              rule: "DNS delegation",
            },
          ],
          searchProps: { shouldFilterRows: true },
        },
      });

      const searchInput = screen.getByRole("searchbox");

      await user.type(searchInput, "load balancer 1");
      expect(getBodyRows()).toHaveLength(1);

      await user.clear(searchInput);
      await user.type(searchInput, "dns");
      expect(getBodyRows()).toHaveLength(0);
    });

    it("sorts by a hidden column key", () => {
      render(DataTable, {
        props: {
          headers: [
            { key: "name", value: "Name" },
            { key: "protocol", value: "Protocol" },
            { key: "port", value: "Port", columnHidden: true },
            { key: "rule", value: "Rule" },
          ],
          rows,
          sortable: true,
          sortKey: "port",
          sortDirection: "ascending",
        },
      });

      // Ports 80, 443, and 3000 belong to rows "c", "b", and "a".
      expect(getBodyRows().map((row) => getRowTexts(row)[0])).toEqual([
        "Load Balancer 2",
        "Load Balancer 1",
        "Load Balancer 3",
      ]);
    });

    it("adds and removes the column when hidden is toggled", async () => {
      const { rerender } = render(DataTable, { props: { headers, rows } });

      expect(getColumnHeaderText()).toEqual([
        "Name",
        "Protocol",
        "Port",
        "Rule",
      ]);

      await rerender({ headers: headersWithHiddenProtocol });

      expect(getColumnHeaderText()).toEqual(["Name", "Port", "Rule"]);
      expect(getRowTexts(getBodyRows()[0])).toEqual([
        "Load Balancer 3",
        "3000",
        "Round robin",
      ]);

      await rerender({ headers });

      expect(getColumnHeaderText()).toEqual([
        "Name",
        "Protocol",
        "Port",
        "Rule",
      ]);
      expect(getRowTexts(getBodyRows()[0])).toEqual([
        "Load Balancer 3",
        "HTTP",
        "3000",
        "Round robin",
      ]);
    });

    it("sizes virtualization spacer rows to the visible column count", () => {
      const largeRows = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        name: `Load Balancer ${i + 1}`,
        protocol: "HTTP",
        port: 3000 + i * 10,
        rule: "Round robin",
      }));

      render(DataTable, {
        props: {
          headers: headersWithHiddenProtocol,
          rows: largeRows,
          virtualize: true,
        },
      });

      // Spacer rows are the only rows with an inline height.
      const spacerRows = getBodyRows().filter((row) =>
        row.getAttribute("style")?.includes("height:"),
      );
      expect(spacerRows.length).toBeGreaterThan(0);
      for (const row of spacerRows) {
        expect(within(row).getByRole("cell")).toHaveAttribute("colspan", "3");
      }
    });
  });
});

describe("DataTable header width", () => {
  const headers = [
    { key: "name", value: "Name", width: "200px" },
    { key: "status", value: "Status" },
  ] as const;

  const rows = [{ id: "a", name: "payments-api", status: "Active" }];

  it.each([
    [{}, 0],
    [{ expandable: true }, 1],
    [{ selectable: true }, 1],
    [{ expandable: true, selectable: true }, 2],
  ])("lines a sized header's col up with its column (%o)", (props, leading) => {
    const { container } = render(DataTable, { headers, rows, ...props });

    const cols = container.querySelectorAll("colgroup col");
    expect(cols).toHaveLength(leading + headers.length);
    expectInlineStyle(cols[leading], { width: "200px" });
  });
});
