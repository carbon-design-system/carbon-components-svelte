import { screen, within } from "@testing-library/svelte";
import type { DataTableValue } from "carbon-components-svelte/DataTable/DataTable.svelte";
import { user } from "../utils/user";

type Spy = ReturnType<typeof vi.fn>;

/** Returns only the `<tr>` rows inside `<tbody>`, excluding the header row. */
export function getBodyRows() {
  return screen
    .getAllByRole("row")
    .filter((row) => row.closest("tbody") !== null);
}

/** Returns the first body row, asserting that at least one exists. */
export function getFirstBodyRow() {
  const rows = getBodyRows();
  expect(rows.length).toBeGreaterThan(0);
  return rows[0];
}

/** Returns every row after the header row. */
export function getTableRows() {
  return screen.getAllByRole("row").slice(1);
}

/** Returns the trimmed text content of every column header. */
export function getColumnHeaderText() {
  return screen
    .getAllByRole("columnheader")
    .map((columnHeader) => columnHeader.textContent?.trim());
}

/** Parses the JSON blob a ToolbarSearch fixture renders into a testid element. */
export function getFilteredIds(testId: string) {
  const element = screen.getByTestId(testId);
  return JSON.parse(element.textContent || "[]");
}

/** Returns the data cells of a body row. */
export function getCells(row: HTMLElement) {
  return within(row).getAllByRole("cell");
}

/** Returns the data cell at `colIndex` of the body row at `rowIndex`. */
export function getCell(rowIndex: number, colIndex: number) {
  return getCells(getBodyRows()[rowIndex])[colIndex];
}

/** Returns the trimmed text of every data cell in a body row. */
export function getRowTexts(row: HTMLElement) {
  return getCells(row).map((cell) => cell.textContent?.trim());
}

/** Returns the trimmed text of one column, top to bottom. */
export function getColumnTexts(colIndex: number) {
  return getBodyRows().map((row) =>
    getCells(row)[colIndex].textContent?.trim(),
  );
}

/** Returns the `data-row` id of every rendered body row. */
export function getRenderedRowIds() {
  return [...document.querySelectorAll("tbody tr[data-row]")].map((tr) =>
    tr.getAttribute("data-row"),
  );
}

/** Returns the row selection checkbox or radio of every body row. */
export function getRowInputs() {
  return [
    ...document.querySelectorAll<HTMLInputElement>(
      'tbody input[type="checkbox"], tbody input[type="radio"]',
    ),
  ];
}

/** Returns the selection checkbox or radio of the body row with `rowId`. */
export function getRowInput(rowId: string) {
  const input = document.querySelector(
    `tr[data-row="${rowId}"] input[type="checkbox"], tr[data-row="${rowId}"] input[type="radio"]`,
  );
  assert(input instanceof HTMLInputElement);
  return input;
}

/** Returns the batch-selection "Select all rows" checkbox. */
export function getSelectAll() {
  return screen.getByRole("checkbox", { name: "Select all rows" });
}

/** Clicks the column header whose text is `name`. */
export function clickHeader(name: string) {
  return user.click(screen.getByText(name));
}

/** Builds `count` rows with string ids "0".."count-1" and names "Row 1".."Row count". */
export function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `Row ${i + 1}`,
  }));
}

/** A spied ascending comparator for a header's `sort` option. */
export function createSortFn() {
  return vi.fn((a: DataTableValue, b: DataTableValue) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}

/** Names an `onevent(name, detail)` spy received, in order, that start with `prefix`. */
export function eventNames(spy: Spy, prefix = "") {
  return spy.mock.calls
    .map(([name]) => String(name))
    .filter((name) => name.startsWith(prefix));
}

/** Details an `onevent(name, detail)` spy received for event `name`, in order. */
export function eventDetails(spy: Spy, name: string) {
  return spy.mock.calls
    .filter(([eventName]) => eventName === name)
    .map(([, detail]) => detail);
}
