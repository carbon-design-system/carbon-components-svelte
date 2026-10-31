/** A cell address. Both indexes are zero-based and count data only: the column header row and the row header column have no address. */
export interface DataGridCell {
  row: number;
  column: number;
}

/** A rectangle of cells. Every bound is inclusive and `start*` is never past `end*`. */
export interface DataGridRange {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface DataGridColumnLayout {
  /** The width of each column in px. */
  widths: number[];
  /** `widths.length + 1` entries: the inline-start edge of each column, then the total. */
  offsets: number[];
  /** The summed width in px. */
  total: number;
}

/** The row height in px for a `size`; an unknown size gets the default 32. */
export function rowHeightForSize(size: string | undefined): number;

/** Columns' pixel widths and their running offsets. A missing or non-positive `width` takes `defaultWidth`. */
export function buildColumnLayout(
  columns: ReadonlyArray<{ width?: number }>,
  defaultWidth: number,
): DataGridColumnLayout;

/** The index of the column holding offset `x`, clamped to the ends; `-1` when there are no columns. */
export function findOffsetIndex(
  offsets: ReadonlyArray<number>,
  x: number,
): number;

/** The columns to paint after the frozen ones, as a half-open range. */
export function getColumnWindow(options: {
  offsets: ReadonlyArray<number>;
  frozenColumns: number;
  gutterWidth: number;
  scrollStart: number;
  viewportWidth: number;
  overscan: number;
}): { start: number; end: number };

/** The rows to paint below the frozen ones, as a half-open range. `lead` is the signed number of rows the last scroll moved. */
export function getRowWindow(options: {
  rowCount: number;
  rowHeight: number;
  frozenRows: number;
  scrollTop: number;
  viewportHeight: number;
  overscan: number;
  lead?: number;
}): { start: number; end: number };

/** The cell a navigation key moves to from `cell`. `key` is read as on an LTR page (`ArrowRight` is the next column). */
export function moveCell(
  key: string,
  cell: DataGridCell,
  options: {
    rowCount: number;
    columnCount: number;
    pageRows: number;
    pageColumns: number;
    ctrl?: boolean;
    alt?: boolean;
  },
): DataGridCell | null;

/** The smallest range holding both cells. */
export function normalizeRange(a: DataGridCell, b: DataGridCell): DataGridRange;

/** Whether two ranges are the same, or both absent. */
export function rangesEqual(
  a: DataGridRange | null | undefined,
  b: DataGridRange | null | undefined,
): boolean;

/** The corner of `selection` opposite `active`, or `active` itself without a selection. */
export function getFarCorner(
  selection: DataGridRange | null | undefined,
  active: DataGridCell,
): DataGridCell;

/** The scroll offsets that bring a cell out from under the frozen areas and into the viewport. */
export function getRevealScroll(options: {
  cell: DataGridCell;
  offsets: ReadonlyArray<number>;
  rowCount: number;
  rowHeight: number;
  frozenRows: number;
  frozenColumns: number;
  gutterWidth: number;
  scrollStart: number;
  scrollTop: number;
  viewportWidth: number;
  viewportHeight: number;
  /** Scroll to the top when the cell is in a frozen row. */
  resetRow?: boolean;
  /** Scroll to the inline start when the cell is in a frozen column. */
  resetColumn?: boolean;
}): { scrollStart: number; scrollTop: number };

/** The cell under a point in the viewport, measured from its inline-start and block-start edges. `row` or `column` is `-1` over a header. */
export function getCellAtPoint(options: {
  x: number;
  y: number;
  offsets: ReadonlyArray<number>;
  rowCount: number;
  rowHeight: number;
  frozenRows: number;
  frozenColumns: number;
  gutterWidth: number;
  scrollStart: number;
  scrollTop: number;
}): DataGridCell;

/** Cells as tab-separated text, quoting a field that holds a tab, a line break or a quote as spreadsheets do. */
export function toTsv(matrix: ReadonlyArray<ReadonlyArray<string>>): string;

/** Cells as an HTML table, which spreadsheets paste with their cells intact. */
export function toHtmlTable(
  matrix: ReadonlyArray<ReadonlyArray<string>>,
): string;

/** Parse tab-separated text into a rectangle of cells, padding short rows. Understands quoted fields. */
export function parseTsv(text: string): string[][];

/** Where a pasted matrix lands, clamped to the grid. */
export function getPasteRange(options: {
  matrix: ReadonlyArray<ReadonlyArray<string>>;
  selection: DataGridRange | null | undefined;
  active: DataGridCell;
  rowCount: number;
  columnCount: number;
}): { range: DataGridRange; truncated: boolean } | null;

/**
 * New rows with a pasted matrix written over `range`, by each column's
 * `key`. A matrix smaller than the range repeats, so one value fills it.
 * Rows outside the range are the same objects, and nothing passed in
 * changes. Runs on the server.
 */
export function applyDataGridPaste<Row extends object>(
  rows: ReadonlyArray<Row>,
  columns: ReadonlyArray<{ key: string }>,
  paste: {
    matrix: ReadonlyArray<ReadonlyArray<string>>;
    range: DataGridRange;
  },
  toValue?: (text: string, column: { key: string }, row: Row) => unknown,
): Row[];
