export type GridRow = {
  type: "header" | "cells";
  /** Index of the section the row belongs to. */
  section: number;
  /** Index of the first cell. `-1` for a header. */
  start: number;
  /** Number of cells. `0` for a header. */
  length: number;
};

export type GridLayout = {
  /** Every row in order, headers included. */
  rows: GridRow[];
  /** Index in `rows` of each line of cells. */
  lineRows: number[];
  /** Line of each cell. */
  itemLine: Int32Array;
  /** Column of each cell in its line. */
  itemColumn: Int32Array;
  /** Index in `rows` of each section's first row, its header when it has one. */
  sectionRows: number[];
  columns: number;
  itemCount: number;
};

/** Lay cells out in lines of `columns`. Each section starts a new line. */
export function buildGridLayout(options: {
  /** Cells in each section, in order. */
  counts: ReadonlyArray<number>;
  columns: number;
  /** Whether each section has a header row. Default none. */
  headers?: ReadonlyArray<boolean>;
}): GridLayout;

/** The height of each row, for `virtualize` and its scroll helpers. */
export function gridRowHeights(
  rows: ReadonlyArray<GridRow>,
  heights: { cell: number; header: number },
): number[];

/** How many cells fit in `width`, so a grid fills its container. */
export function columnsForWidth(options: {
  /** Inner width of the grid in pixels. */
  width: number;
  /** Minimum width of a cell in pixels. */
  cell: number;
  /** Space between cells in pixels. */
  gap?: number;
  /** Columns when `width` is not known yet. */
  fallback?: number;
}): number;

/** The section whose rows hold the top of the viewport, or `-1`. */
export function sectionAtRow(
  rows: ReadonlyArray<GridRow>,
  topRow: number,
): number;

/** Distance from the top of the grid to the top of each row. */
export function rowOffsets(heights: ReadonlyArray<number>): Float64Array;

/** Index of the row that holds `scrollTop`. */
export function rowAtOffset(offsets: Float64Array, scrollTop: number): number;
