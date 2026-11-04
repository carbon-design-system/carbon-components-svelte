// @ts-check
// Pure layout math for a categorized grid of cells that is windowed by row.
// No DOM: `PickerGrid` and its keyboard navigation read the same layout.

/**
 * One row of the windowed grid: a section header, or a line of cells.
 * @typedef {Object} GridRow
 * @property {"header" | "cells"} type
 * @property {number} section - Index of the section the row belongs to.
 * @property {number} start - Index of the first cell. `-1` for a header.
 * @property {number} length - Number of cells. `0` for a header.
 */

/**
 * @typedef {Object} GridLayout
 * @property {GridRow[]} rows - Every row in order, headers included.
 * @property {number[]} lineRows - Index in `rows` of each line of cells.
 * @property {Int32Array} itemLine - Line of each cell.
 * @property {Int32Array} itemColumn - Column of each cell in its line.
 * @property {number[]} sectionRows - Index in `rows` of each section's first row, its header when it has one.
 * @property {number} columns
 * @property {number} itemCount
 */

/**
 * Lay `counts` cells out in lines of `columns`. Each section starts a new
 * line, so a short last line of one section never shares a row with the
 * next.
 *
 * @param {Object} options
 * @param {ReadonlyArray<number>} options.counts - Cells in each section, in order.
 * @param {number} options.columns
 * @param {ReadonlyArray<boolean>} [options.headers] - Whether each section has a header row. Default none.
 * @returns {GridLayout}
 */
export function buildGridLayout({ counts, columns, headers = [] }) {
  const width = Math.max(1, Math.floor(columns) || 1);
  const itemCount = counts.reduce((sum, count) => sum + Math.max(0, count), 0);
  /** @type {GridRow[]} */
  const rows = [];
  /** @type {number[]} */
  const lineRows = [];
  /** @type {number[]} */
  const sectionRows = [];
  const itemLine = new Int32Array(itemCount);
  const itemColumn = new Int32Array(itemCount);

  let start = 0;
  counts.forEach((count, section) => {
    if (count <= 0) {
      sectionRows.push(rows.length);
      return;
    }
    sectionRows.push(rows.length);
    if (headers[section]) {
      rows.push({ type: "header", section, start: -1, length: 0 });
    }
    for (let offset = 0; offset < count; offset += width) {
      const length = Math.min(width, count - offset);
      const line = lineRows.length;
      lineRows.push(rows.length);
      rows.push({ type: "cells", section, start: start + offset, length });
      for (let column = 0; column < length; column++) {
        itemLine[start + offset + column] = line;
        itemColumn[start + offset + column] = column;
      }
    }
    start += count;
  });

  return {
    rows,
    lineRows,
    itemLine,
    itemColumn,
    sectionRows,
    columns: width,
    itemCount,
  };
}

/**
 * The height of each row, for `virtualize` and its scroll helpers.
 *
 * @param {ReadonlyArray<GridRow>} rows
 * @param {{ cell: number, header: number }} heights
 * @returns {number[]}
 */
export function gridRowHeights(rows, heights) {
  return rows.map((row) =>
    row.type === "header" ? heights.header : heights.cell,
  );
}

/**
 * How many cells fit in `width`, so a grid fills its container.
 *
 * @param {Object} options
 * @param {number} options.width - Inner width of the grid in pixels.
 * @param {number} options.cell - Minimum width of a cell in pixels.
 * @param {number} [options.gap] - Space between cells in pixels.
 * @param {number} [options.fallback] - Columns when `width` is not known yet.
 * @returns {number}
 */
export function columnsForWidth({ width, cell, gap = 0, fallback = 8 }) {
  if (!(width > 0) || !(cell > 0)) return fallback;
  return Math.max(1, Math.floor((width + gap) / (cell + gap)));
}

/**
 * The section whose rows hold the top of the viewport.
 *
 * @param {ReadonlyArray<GridRow>} rows
 * @param {number} topRow - Index in `rows` of the first row in view.
 * @returns {number} Index of the section, or `-1` when there are no rows.
 */
export function sectionAtRow(rows, topRow) {
  if (rows.length === 0) return -1;
  return rows[Math.min(Math.max(0, topRow), rows.length - 1)].section;
}

/**
 * Distance from the top of the grid to the top of each row. The last entry
 * is the total height.
 *
 * @param {ReadonlyArray<number>} heights
 * @returns {Float64Array}
 */
export function rowOffsets(heights) {
  const offsets = new Float64Array(heights.length + 1);
  for (let index = 0; index < heights.length; index++) {
    offsets[index + 1] = offsets[index] + heights[index];
  }
  return offsets;
}

/**
 * Index of the row that holds `scrollTop`.
 *
 * @param {Float64Array} offsets - From `rowOffsets`.
 * @param {number} scrollTop
 * @returns {number}
 */
export function rowAtOffset(offsets, scrollTop) {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (offsets[mid] <= scrollTop) low = mid;
    else high = mid - 1;
  }
  return Math.max(0, low);
}
