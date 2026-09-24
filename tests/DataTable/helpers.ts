import { screen } from "@testing-library/svelte";

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
