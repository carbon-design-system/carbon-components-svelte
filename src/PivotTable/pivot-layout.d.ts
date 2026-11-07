import type { PivotNode, PivotResult } from "./pivot.js";

export type PivotLayoutOptions = {
  expandedRowIds?: ReadonlySet<string>;
  expandedColumnIds?: ReadonlySet<string>;
  /** Show the grand total row and column. Defaults to `true`. */
  grandTotals?: boolean;
  /** Defaults to `"Grand total"`. */
  grandTotalText?: string;
  /** The header of an expanded column group's subtotal. Defaults to `"<label> total"`. */
  subtotalText?: (label: string) => string;
  /** The corner cell. Defaults to the row field labels joined by " / ". */
  rowHeaderText?: string;
};

export type PivotLayoutRow = {
  id: string;
  node: PivotNode;
  label: string;
  kind: "group" | "leaf" | "grand";
  /** Zero-based nesting depth. */
  level: number;
  expandable: boolean;
  expanded: boolean;
  /** One-based position among siblings. */
  posInSet: number;
  setSize: number;
};

export type PivotLayoutColumn = {
  id: string;
  node: PivotNode;
  /** Index in `values`. */
  value: number;
  kind: "node" | "subtotal" | "grand";
};

export type PivotHeaderCell = {
  id: string;
  kind: "corner" | "group" | "leaf" | "subtotal" | "grand" | "value";
  text: string;
  /** Header row, zero-based. */
  row: number;
  /** Table column, zero-based; `0` is the row header column. */
  col: number;
  rowSpan: number;
  colSpan: number;
  node: PivotNode | undefined;
  /** Index in `values`, or `-1`. */
  value: number;
  expandable: boolean;
  expanded: boolean;
};

export type PivotLayout = {
  rows: PivotLayoutRow[];
  columns: PivotLayoutColumn[];
  headerRows: PivotHeaderCell[][];
  headerRowCount: number;
  /** Table columns, row header column included. */
  columnCount: number;
  /** The header cell that covers a position. */
  headerCellAt: (row: number, col: number) => PivotHeaderCell;
};

/** The visible rows, columns and header cells for a set of expanded groups. */
export function layoutPivot(
  result: PivotResult,
  options?: PivotLayoutOptions,
): PivotLayout;

/** The ids of every node that has children, outermost first. */
export function groupIds(root: PivotNode): string[];

/**
 * Formats an aggregate with the value's `Intl.NumberFormat` options and the
 * locale. Returns `""` for `null`.
 */
export function createPivotFormatter(
  values: PivotResult["values"],
  locale?: string,
): (value: number | null, index?: number) => string;

export type PivotCsvOptions = {
  /** Write numbers as shown. Defaults to `false`: the raw number, which a spreadsheet can sum. */
  formatted?: boolean;
  /** For `formatted`. */
  locale?: string;
  /** Defaults to `","`. */
  delimiter?: string;
  /** Defaults to `"\r\n"`. */
  newline?: string;
};

/**
 * Serialize the visible pivot. The row labels take one column per row field,
 * each group's label in the column of its level; the header takes one line
 * per column field, with the label on the first line of a group's span.
 * A text field that starts like a formula is prefixed with `'`.
 */
export function pivotToCsv(
  result: PivotResult,
  layout: PivotLayout,
  options?: PivotCsvOptions,
): string;
