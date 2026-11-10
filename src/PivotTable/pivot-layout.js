// @ts-check
// The visible part of a pivot: which rows and columns show for a set of
// expanded groups, the header cells with their spans, and the CSV of that view.
// It reads a `PivotResult` and never aggregates, so expanding or collapsing a
// group only re-runs this walk (a few hundred nodes), not the pivot.

import { escapeCsvField } from "../DataTable/data-table-utils.js";
import { getNumberFormatter } from "../utils/intl-formatter-cache.js";

/**
 * @typedef {import("./pivot.js").PivotNode} PivotNode
 * @typedef {import("./pivot.js").PivotResult} PivotResult
 */

/**
 * @typedef {object} PivotLayoutOptions
 * @property {ReadonlySet<string>} [expandedRowIds]
 * @property {ReadonlySet<string>} [expandedColumnIds]
 * @property {boolean} [grandTotals] - Show the grand total row and column. Defaults to `true`.
 * @property {string} [grandTotalText] - Defaults to `"Grand total"`.
 * @property {(label: string) => string} [subtotalText] - The header of an expanded column group's subtotal. Defaults to `"<label> total"`.
 * @property {string} [rowHeaderText] - The corner cell. Defaults to the row field labels joined by " / ".
 */

/**
 * @typedef {object} PivotLayoutRow
 * @property {string} id
 * @property {PivotNode} node
 * @property {string} label
 * @property {"group" | "leaf" | "grand"} kind
 * @property {number} level - Zero-based nesting depth.
 * @property {boolean} expandable
 * @property {boolean} expanded
 * @property {number} posInSet - One-based position among siblings.
 * @property {number} setSize
 */

/**
 * @typedef {object} PivotLayoutColumn
 * @property {string} id
 * @property {PivotNode} node
 * @property {number} value - Index in `values`.
 * @property {"node" | "subtotal" | "grand"} kind
 */

/**
 * @typedef {object} PivotHeaderCell
 * @property {string} id
 * @property {"corner" | "group" | "leaf" | "subtotal" | "grand" | "value"} kind
 * @property {string} text
 * @property {number} row - Header row, zero-based.
 * @property {number} col - Table column, zero-based; `0` is the row header column.
 * @property {number} rowSpan
 * @property {number} colSpan
 * @property {PivotNode | undefined} node
 * @property {number} value - Index in `values`, or `-1`.
 * @property {boolean} expandable
 * @property {boolean} expanded
 */

/**
 * @typedef {object} PivotLayout
 * @property {PivotLayoutRow[]} rows
 * @property {PivotLayoutColumn[]} columns
 * @property {PivotHeaderCell[][]} headerRows
 * @property {number} headerRowCount
 * @property {number} columnCount - Table columns, row header column included.
 * @property {(row: number, col: number) => PivotHeaderCell} headerCellAt - The header cell that covers a position.
 */

/**
 * @param {PivotResult} result
 * @param {PivotLayoutOptions} [options]
 * @returns {PivotLayout}
 */
export function layoutPivot(result, options = {}) {
  const {
    expandedRowIds = new Set(),
    expandedColumnIds = new Set(),
    grandTotals = true,
    grandTotalText = "Grand total",
    subtotalText = (label) => `${label} total`,
    rowHeaderText = result.rowFields.map((f) => f.label).join(" / "),
  } = options;
  const V = result.values.length;
  const depth = result.columnFields.length;
  // Header rows for the column fields, then one for the values if several.
  const levels = Math.max(depth, 1);
  let headerRowCount = levels + (V > 1 ? 1 : 0);

  /** @type {PivotLayoutColumn[]} */
  const columns = [];
  /** @type {PivotHeaderCell[][]} */
  const headerRows = Array.from({ length: headerRowCount }, () => []);

  /**
   * @param {PivotNode} node
   * @param {PivotLayoutColumn["kind"]} kind
   */
  function pushColumns(node, kind) {
    for (let v = 0; v < V; v++) {
      columns.push({ id: `${node.id}|${kind}|${v}`, node, value: v, kind });
    }
  }

  /** @param {PivotNode} node */
  function emitColumn(node) {
    const start = columns.length;
    const expandable = node.children.length > 0;
    const expanded = expandable && expandedColumnIds.has(node.id);
    if (!expanded) {
      pushColumns(node, "node");
      headerRows[node.level].push({
        id: `h|${node.id}`,
        kind: expandable ? "group" : "leaf",
        text: node.label,
        row: node.level,
        col: 1 + start,
        rowSpan: levels - node.level,
        colSpan: V,
        node,
        value: -1,
        expandable,
        expanded: false,
      });
      return;
    }
    for (const child of node.children) emitColumn(child);
    pushColumns(node, "subtotal");
    headerRows[node.level + 1].push({
      id: `s|${node.id}`,
      kind: "subtotal",
      text: subtotalText(node.label),
      row: node.level + 1,
      col: 1 + columns.length - V,
      rowSpan: levels - node.level - 1,
      colSpan: V,
      node,
      value: -1,
      expandable: false,
      expanded: false,
    });
    headerRows[node.level].push({
      id: `h|${node.id}`,
      kind: "group",
      text: node.label,
      row: node.level,
      col: 1 + start,
      rowSpan: 1,
      colSpan: columns.length - start,
      node,
      value: -1,
      expandable: true,
      expanded: true,
    });
  }

  if (depth === 0) {
    pushColumns(result.columnRoot, "grand");
    headerRows[0].push(
      grandHeader(result.columnRoot, 1, levels, V, grandTotalText),
    );
  } else {
    for (const node of result.columnRoot.children) emitColumn(node);
    if (grandTotals) {
      const start = columns.length;
      pushColumns(result.columnRoot, "grand");
      headerRows[0].push(
        grandHeader(result.columnRoot, 1 + start, levels, V, grandTotalText),
      );
    }
  }

  if (V > 1) {
    for (let i = 0; i < columns.length; i++) {
      headerRows[levels].push({
        id: `v|${columns[i].id}`,
        kind: "value",
        text: result.values[columns[i].value].label,
        row: levels,
        col: 1 + i,
        rowSpan: 1,
        colSpan: 1,
        node: undefined,
        value: columns[i].value,
        expandable: false,
        expanded: false,
      });
    }
  }
  const corner = {
    id: "corner",
    kind: /** @type {const} */ ("corner"),
    text: rowHeaderText,
    row: 0,
    col: 0,
    rowSpan: headerRowCount,
    colSpan: 1,
    node: undefined,
    value: -1,
    expandable: false,
    expanded: false,
  };
  headerRows[0].unshift(corner);

  // A row whose cells all hang from rows above (every group collapsed) has
  // no cell of its own. Drop it and shorten the spans that crossed it.
  for (let r = headerRows.length - 1; r >= 0; r--) {
    if (headerRows[r].length > 0) continue;
    headerRows.splice(r, 1);
    for (const cells of headerRows) {
      for (const cell of cells) {
        if (cell.row > r) cell.row--;
        else if (cell.row + cell.rowSpan > r) cell.rowSpan--;
      }
    }
  }
  headerRowCount = headerRows.length;

  const columnCount = columns.length + 1;
  // Which header cell covers each position, for moving by arrow key.
  const covers = new Array(headerRowCount * columnCount);
  for (const cells of headerRows) {
    for (const cell of cells) {
      for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
        for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
          covers[r * columnCount + c] = cell;
        }
      }
    }
  }

  /** @type {PivotLayoutRow[]} */
  const rows = [];
  const top = result.rowRoot.children;
  /**
   * @param {PivotNode} node
   * @param {number} posInSet
   * @param {number} setSize
   */
  function emitRow(node, posInSet, setSize) {
    const expandable = node.children.length > 0;
    const expanded = expandable && expandedRowIds.has(node.id);
    rows.push({
      id: node.id,
      node,
      label: node.label,
      kind: expandable ? "group" : "leaf",
      level: node.level,
      expandable,
      expanded,
      posInSet,
      setSize,
    });
    if (expanded) {
      for (let i = 0; i < node.children.length; i++) {
        emitRow(node.children[i], i + 1, node.children.length);
      }
    }
  }
  if (result.rowFields.length === 0) {
    rows.push(grandRow(result.rowRoot, grandTotalText, 1, 1));
  } else {
    const size = top.length + (grandTotals ? 1 : 0);
    for (let i = 0; i < top.length; i++) emitRow(top[i], i + 1, size);
    if (grandTotals)
      rows.push(grandRow(result.rowRoot, grandTotalText, size, size));
  }

  return {
    rows,
    columns,
    headerRows,
    headerRowCount,
    columnCount,
    headerCellAt: (row, col) => covers[row * columnCount + col],
  };
}

/**
 * @param {PivotNode} root
 * @param {number} col
 * @param {number} levels
 * @param {number} V
 * @param {string} text
 * @returns {PivotHeaderCell}
 */
function grandHeader(root, col, levels, V, text) {
  return {
    id: "h|grand",
    kind: "grand",
    text,
    row: 0,
    col,
    rowSpan: levels,
    colSpan: V,
    node: root,
    value: -1,
    expandable: false,
    expanded: false,
  };
}

/**
 * @param {PivotNode} root
 * @param {string} label
 * @param {number} posInSet
 * @param {number} setSize
 * @returns {PivotLayoutRow}
 */
function grandRow(root, label, posInSet, setSize) {
  return {
    id: "grand",
    node: root,
    label,
    kind: "grand",
    level: 0,
    expandable: false,
    expanded: false,
    posInSet,
    setSize,
  };
}

/**
 * The ids of every node that has children, outermost first.
 * @param {PivotNode} root
 * @returns {string[]}
 */
export function groupIds(root) {
  /** @type {string[]} */
  const ids = [];
  /** @param {PivotNode} node */
  const walk = (node) => {
    if (node.children.length === 0) return;
    if (node.level >= 0) ids.push(node.id);
    for (const child of node.children) walk(child);
  };
  walk(root);
  return ids;
}

/**
 * A function that formats an aggregate with the value's `Intl.NumberFormat`
 * options and the locale. Returns `""` for `null`.
 * @param {PivotResult["values"]} values
 * @param {string} [locale]
 * @returns {(value: number | null, index?: number) => string}
 */
export function createPivotFormatter(values, locale) {
  const formatters = values.map((spec) =>
    getNumberFormatter(locale, spec.format),
  );
  return (value, index = 0) =>
    value === null ? "" : formatters[index].format(value);
}

/**
 * @typedef {object} PivotCsvOptions
 * @property {boolean} [formatted] - Write numbers as shown. Defaults to `false`: the raw number, which a spreadsheet can sum.
 * @property {string} [locale] - For `formatted`.
 * @property {string} [delimiter] - Defaults to `","`.
 * @property {string} [newline] - Defaults to `"\r\n"`.
 */

/**
 * Serialize the visible pivot. The row labels take one column per row field,
 * each group's label in the column of its level; the header takes one line
 * per column field, with the label on the first line of a group's span.
 * A text field that starts like a formula is prefixed with `'`.
 * @param {PivotResult} result
 * @param {PivotLayout} layout
 * @param {PivotCsvOptions} [options]
 * @returns {string}
 */
export function pivotToCsv(result, layout, options = {}) {
  const {
    formatted = false,
    locale,
    delimiter = ",",
    newline = "\r\n",
  } = options;
  const format = createPivotFormatter(result.values, locale);
  const nameColumns = Math.max(result.rowFields.length, 1);
  /** @param {string} text */
  const text = (text) => escapeCsvField(text, delimiter, true);
  const lines = [];

  for (let r = 0; r < layout.headerRowCount; r++) {
    /** @type {string[]} */
    const cells = Array(nameColumns).fill("");
    if (r === layout.headerRowCount - 1) {
      result.rowFields.forEach((f, i) => {
        cells[i] = text(f.label);
      });
    }
    for (let c = 1; c < layout.columnCount; c++) {
      const cell = layout.headerCellAt(r, c);
      cells.push(cell.row === r && cell.col === c ? text(cell.text) : "");
    }
    lines.push(cells.join(delimiter));
  }

  for (const row of layout.rows) {
    /** @type {string[]} */
    const cells = Array(nameColumns).fill("");
    cells[row.kind === "grand" ? 0 : row.level] = text(row.label);
    for (const column of layout.columns) {
      const value = result.get(row.node, column.node, column.value);
      cells.push(
        value === null
          ? ""
          : formatted
            ? text(format(value, column.value))
            : String(value),
      );
    }
    lines.push(cells.join(delimiter));
  }
  return lines.join(newline);
}
