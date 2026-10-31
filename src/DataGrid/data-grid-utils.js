// @ts-check
// Pure geometry, navigation and clipboard math for `DataGrid`. Nothing here
// reads the DOM: the grid paints a window of fixed-size rows and columns, so
// where everything sits follows from the scroll offsets and the column
// widths. That keeps a key press and a pointer move free of layout reads.
//
// Content coordinates run along the inline axis from the inline-start edge
// of the row header gutter. Column `c` starts at `gutterWidth + offsets[c]`.
// Along the block axis the column header row is one `rowHeight` tall and data
// row `r` starts at `rowHeight * (r + 1)`.

/**
 * @typedef {import("./data-grid-utils.js").DataGridCell} DataGridCell
 * @typedef {import("./data-grid-utils.js").DataGridRange} DataGridRange
 */

const ROW_HEIGHTS = new Map([
  ["compact", 24],
  ["xs", 24],
  ["short", 32],
  ["sm", 32],
  ["medium", 40],
  ["md", 40],
  ["default", 48],
  ["lg", 48],
  ["tall", 64],
  ["xl", 64],
]);

/** @param {string | undefined} size */
export function rowHeightForSize(size) {
  return ROW_HEIGHTS.get(/** @type {string} */ (size)) ?? 32;
}

/**
 * @param {ReadonlyArray<{ width?: number }>} columns
 * @param {number} defaultWidth
 */
export function buildColumnLayout(columns, defaultWidth) {
  /** @type {number[]} */
  const widths = [];
  const offsets = [0];
  let total = 0;
  for (const column of columns) {
    const width =
      typeof column.width === "number" && column.width > 0
        ? column.width
        : defaultWidth;
    widths.push(width);
    total += width;
    offsets.push(total);
  }
  return { widths, offsets, total };
}

/**
 * @param {ReadonlyArray<number>} offsets
 * @param {number} x
 * @returns {number}
 */
export function findOffsetIndex(offsets, x) {
  const count = offsets.length - 1;
  if (count <= 0) return -1;
  if (!(x > 0)) return 0;
  if (x >= offsets[count]) return count - 1;
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (offsets[middle] <= x) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * @param {Object} options
 * @param {ReadonlyArray<number>} options.offsets
 * @param {number} options.frozenColumns
 * @param {number} options.gutterWidth
 * @param {number} options.scrollStart - Distance scrolled from the inline start, never negative.
 * @param {number} options.viewportWidth
 * @param {number} options.overscan
 * @returns {{ start: number, end: number }}
 */
export function getColumnWindow({
  offsets,
  frozenColumns,
  gutterWidth,
  scrollStart,
  viewportWidth,
  overscan,
}) {
  const count = offsets.length - 1;
  const first = Math.min(Math.max(frozenColumns, 0), Math.max(count, 0));
  if (first >= count) return { start: count, end: count };
  // The scrolling columns show to the inline end of the frozen ones.
  const from = scrollStart + offsets[first];
  const to = scrollStart + viewportWidth - gutterWidth;
  const start = Math.max(first, findOffsetIndex(offsets, from) - overscan);
  const end = Math.min(count, findOffsetIndex(offsets, to) + 1 + overscan);
  return { start, end: Math.max(start, end) };
}

/**
 * @param {Object} options
 * @param {number} options.rowCount
 * @param {number} options.rowHeight
 * @param {number} options.frozenRows
 * @param {number} options.scrollTop
 * @param {number} options.viewportHeight
 * @param {number} options.overscan
 * @param {number} [options.lead] - Signed rows the last scroll moved. The window reaches that far ahead.
 * @returns {{ start: number, end: number }}
 */
export function getRowWindow({
  rowCount,
  rowHeight,
  frozenRows,
  scrollTop,
  viewportHeight,
  overscan,
  lead = 0,
}) {
  const first = Math.min(Math.max(frozenRows, 0), Math.max(rowCount, 0));
  if (first >= rowCount || !(rowHeight > 0)) {
    return { start: rowCount, end: rowCount };
  }
  // The column header is one row tall, so the first row below the frozen
  // ones is `first` plus the rows scrolled away.
  const top = first + Math.floor(Math.max(scrollTop, 0) / rowHeight);
  const bottom = Math.ceil((scrollTop + viewportHeight) / rowHeight) - 1;
  const ahead = Math.max(0, lead);
  const behind = Math.max(0, -lead);
  const start = Math.min(rowCount, Math.max(first, top - overscan - behind));
  const end = Math.min(rowCount, Math.max(start, bottom + overscan + ahead));
  return { start, end };
}

/**
 * @param {string} key
 * @param {DataGridCell} cell
 * @param {Object} options
 * @param {number} options.rowCount
 * @param {number} options.columnCount
 * @param {number} options.pageRows
 * @param {number} options.pageColumns
 * @param {boolean} [options.ctrl]
 * @param {boolean} [options.alt]
 * @returns {DataGridCell | null} `null` for a key that does not move.
 */
export function moveCell(
  key,
  cell,
  { rowCount, columnCount, pageRows, pageColumns, ctrl = false, alt = false },
) {
  const lastRow = rowCount - 1;
  const lastColumn = columnCount - 1;
  let { row, column } = cell;
  switch (key) {
    case "ArrowUp":
      row = ctrl ? 0 : row - 1;
      break;
    case "ArrowDown":
      row = ctrl ? lastRow : row + 1;
      break;
    case "ArrowLeft":
      column = ctrl ? 0 : column - 1;
      break;
    case "ArrowRight":
      column = ctrl ? lastColumn : column + 1;
      break;
    case "Home":
      column = 0;
      if (ctrl) row = 0;
      break;
    case "End":
      column = lastColumn;
      if (ctrl) row = lastRow;
      break;
    case "PageUp":
      if (alt) column -= pageColumns;
      else row -= pageRows;
      break;
    case "PageDown":
      if (alt) column += pageColumns;
      else row += pageRows;
      break;
    default:
      return null;
  }
  return {
    row: Math.min(Math.max(row, 0), Math.max(lastRow, 0)),
    column: Math.min(Math.max(column, 0), Math.max(lastColumn, 0)),
  };
}

/**
 * @param {DataGridCell} a
 * @param {DataGridCell} b
 * @returns {DataGridRange}
 */
export function normalizeRange(a, b) {
  return {
    startRow: Math.min(a.row, b.row),
    startColumn: Math.min(a.column, b.column),
    endRow: Math.max(a.row, b.row),
    endColumn: Math.max(a.column, b.column),
  };
}

/**
 * @param {DataGridRange | null | undefined} a
 * @param {DataGridRange | null | undefined} b
 */
export function rangesEqual(a, b) {
  if (!a || !b) return !a && !b;
  return (
    a.startRow === b.startRow &&
    a.startColumn === b.startColumn &&
    a.endRow === b.endRow &&
    a.endColumn === b.endColumn
  );
}

/**
 * @param {DataGridRange | null | undefined} selection
 * @param {DataGridCell} active
 * @returns {DataGridCell}
 */
export function getFarCorner(selection, active) {
  if (!selection) return active;
  return {
    row:
      active.row === selection.startRow ? selection.endRow : selection.startRow,
    column:
      active.column === selection.startColumn
        ? selection.endColumn
        : selection.startColumn,
  };
}

/**
 * @param {Object} options
 * @param {DataGridCell} options.cell
 * @param {ReadonlyArray<number>} options.offsets
 * @param {number} options.rowCount
 * @param {number} options.rowHeight
 * @param {number} options.frozenRows
 * @param {number} options.frozenColumns
 * @param {number} options.gutterWidth
 * @param {number} options.scrollStart
 * @param {number} options.scrollTop
 * @param {number} options.viewportWidth
 * @param {number} options.viewportHeight
 * @param {boolean} [options.resetRow] - Scroll to the top for a frozen row. The cell moved to it along the block axis.
 * @param {boolean} [options.resetColumn] - Scroll to the inline start for a frozen column. The cell moved to it along the inline axis.
 * @returns {{ scrollStart: number, scrollTop: number }}
 */
export function getRevealScroll({
  cell,
  offsets,
  rowCount,
  rowHeight,
  frozenRows,
  frozenColumns,
  gutterWidth,
  scrollStart,
  scrollTop,
  viewportWidth,
  viewportHeight,
  resetRow = false,
  resetColumn = false,
}) {
  const columnCount = offsets.length - 1;
  let nextStart = scrollStart;
  let nextTop = scrollTop;

  // A frozen cell never moves, so it is always in view. Moving to one still
  // brings the start of that axis back, as Home does on a spreadsheet.
  if (cell.column < frozenColumns) {
    if (resetColumn) nextStart = 0;
  } else if (cell.column < columnCount) {
    const stuck = gutterWidth + offsets[Math.min(frozenColumns, columnCount)];
    const from = gutterWidth + offsets[cell.column];
    const to = gutterWidth + offsets[cell.column + 1];
    if (from < scrollStart + stuck) nextStart = from - stuck;
    else if (to > scrollStart + viewportWidth) nextStart = to - viewportWidth;
    const maxStart = Math.max(
      0,
      gutterWidth + offsets[columnCount] - viewportWidth,
    );
    nextStart = Math.min(Math.max(nextStart, 0), maxStart);
  }

  if (cell.row < frozenRows) {
    if (resetRow) nextTop = 0;
  } else if (cell.row < rowCount) {
    const stuck = rowHeight * (Math.min(frozenRows, rowCount) + 1);
    const from = rowHeight * (cell.row + 1);
    const to = from + rowHeight;
    if (from < scrollTop + stuck) nextTop = from - stuck;
    else if (to > scrollTop + viewportHeight) nextTop = to - viewportHeight;
    const maxTop = Math.max(0, rowHeight * (rowCount + 1) - viewportHeight);
    nextTop = Math.min(Math.max(nextTop, 0), maxTop);
  }

  return { scrollStart: nextStart, scrollTop: nextTop };
}

/**
 * @param {Object} options
 * @param {number} options.x - From the viewport's inline-start edge.
 * @param {number} options.y - From the viewport's block-start edge.
 * @param {ReadonlyArray<number>} options.offsets
 * @param {number} options.rowCount
 * @param {number} options.rowHeight
 * @param {number} options.frozenRows
 * @param {number} options.frozenColumns
 * @param {number} options.gutterWidth
 * @param {number} options.scrollStart
 * @param {number} options.scrollTop
 * @returns {DataGridCell}
 */
export function getCellAtPoint({
  x,
  y,
  offsets,
  rowCount,
  rowHeight,
  frozenRows,
  frozenColumns,
  gutterWidth,
  scrollStart,
  scrollTop,
}) {
  const columnCount = offsets.length - 1;
  const stuckWidth =
    gutterWidth + offsets[Math.min(Math.max(frozenColumns, 0), columnCount)];
  const stuckHeight =
    rowHeight * (Math.min(Math.max(frozenRows, 0), rowCount) + 1);
  const contentX = x < stuckWidth ? x : x + scrollStart;
  const contentY = y < stuckHeight ? y : y + scrollTop;

  const column =
    contentX < gutterWidth
      ? -1
      : findOffsetIndex(offsets, contentX - gutterWidth);
  const row =
    contentY < rowHeight
      ? -1
      : Math.min(rowCount - 1, Math.floor(contentY / rowHeight) - 1);
  return { row, column };
}

const RE_NEEDS_QUOTES = /[\t\n\r"]/;

/** @param {string} field */
function quoteField(field) {
  return RE_NEEDS_QUOTES.test(field)
    ? `"${field.replaceAll('"', '""')}"`
    : field;
}

/** @param {ReadonlyArray<ReadonlyArray<string>>} matrix */
export function toTsv(matrix) {
  return matrix.map((row) => row.map(quoteField).join("\t")).join("\n");
}

/** @param {string} text */
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** @param {ReadonlyArray<ReadonlyArray<string>>} matrix */
export function toHtmlTable(matrix) {
  const rows = matrix
    .map(
      (row) =>
        `<tr>${row.map((field) => `<td>${escapeHtml(field)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><tbody>${rows}</tbody></table>`;
}

/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseTsv(text) {
  if (text === "") return [];
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = "";
  let quoted = false;
  let width = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === "\t") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      width = Math.max(width, row.length);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // A closing line break ends the last row; it does not start another.
  const endedWithBreak = row.length === 0 && field === "";
  if (!endedWithBreak) {
    row.push(field);
    rows.push(row);
    width = Math.max(width, row.length);
  }

  for (const filled of rows) {
    while (filled.length < width) filled.push("");
  }
  return rows;
}

/**
 * @param {Object} options
 * @param {ReadonlyArray<ReadonlyArray<string>>} options.matrix
 * @param {DataGridRange | null | undefined} options.selection
 * @param {DataGridCell} options.active
 * @param {number} options.rowCount
 * @param {number} options.columnCount
 * @returns {{ range: DataGridRange, truncated: boolean } | null}
 */
export function getPasteRange({
  matrix,
  selection,
  active,
  rowCount,
  columnCount,
}) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  if (height === 0 || width === 0 || rowCount === 0 || columnCount === 0) {
    return null;
  }
  // One value pasted over a selection fills the selection.
  if (selection && height === 1 && width === 1) {
    return { range: selection, truncated: false };
  }
  const startRow = selection ? selection.startRow : active.row;
  const startColumn = selection ? selection.startColumn : active.column;
  const endRow = startRow + height - 1;
  const endColumn = startColumn + width - 1;
  return {
    range: {
      startRow,
      startColumn,
      endRow: Math.min(endRow, rowCount - 1),
      endColumn: Math.min(endColumn, columnCount - 1),
    },
    truncated: endRow > rowCount - 1 || endColumn > columnCount - 1,
  };
}

/**
 * New rows with a pasted matrix written over `range`, by each column's
 * `key`. A matrix smaller than the range repeats, so one value fills it.
 * Rows outside the range are the same objects, and nothing passed in
 * changes. Runs on the server.
 * @template {object} Row
 * @param {ReadonlyArray<Row>} rows
 * @param {ReadonlyArray<{ key: string }>} columns
 * @param {{ matrix: ReadonlyArray<ReadonlyArray<string>>; range: DataGridRange }} paste - The `paste` event's `detail`.
 * @param {(text: string, column: { key: string }, row: Row) => any} [toValue] - Turns pasted text into a value. Defaults to the text.
 * @returns {Row[]}
 */
export function applyDataGridPaste(
  rows,
  columns,
  { matrix, range },
  toValue = (text) => text,
) {
  const next = rows.slice();
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  if (height === 0 || width === 0) return next;
  const endRow = Math.min(range.endRow, rows.length - 1);
  const endColumn = Math.min(range.endColumn, columns.length - 1);
  for (let r = range.startRow; r <= endRow; r++) {
    const source = rows[r];
    const line = matrix[(r - range.startRow) % height];
    /** @type {Record<string, any>} */
    const row = { ...source };
    for (let c = range.startColumn; c <= endColumn; c++) {
      const column = columns[c];
      row[column.key] = toValue(
        line[(c - range.startColumn) % width] ?? "",
        column,
        source,
      );
    }
    next[r] = /** @type {Row} */ (row);
  }
  return next;
}
