// @ts-check

/**
 * The cells of a row that take part in cell navigation: the ones `DataTable`
 * gave a `tabindex`. The expand, selection and overflow menu cells have none.
 * @param {Element | null} row
 * @returns {HTMLTableCellElement[]}
 */
function navigableCells(row) {
  return row
    ? /** @type {HTMLTableCellElement[]} */ (
        Array.from(row.children).filter(
          (child) => child.tagName === "TD" && child.hasAttribute("tabindex"),
        )
      )
    : [];
}

/**
 * The rows of the table body a cell can move to: a row's own `data-row`
 * marks it, which leaves out expanded content and hidden (filtered) rows.
 * @param {Element | null} row
 * @returns {Element[]}
 */
function navigableRows(row) {
  return row?.parentElement
    ? Array.from(row.parentElement.children).filter(
        (child) =>
          child.hasAttribute("data-row") && !child.hasAttribute("hidden"),
      )
    : [];
}

/**
 * The header cells of the columns that body cells navigate in, in the same
 * order: each `th` a `TableHeader` rendered (`data-header`). The expand,
 * selection and empty header cells have none.
 * @param {Element | null} table
 * @returns {HTMLTableCellElement[]}
 */
function headerCells(table) {
  return table
    ? /** @type {HTMLTableCellElement[]} */ (
        Array.from(table.querySelectorAll("thead th[data-header]"))
      )
    : [];
}

/**
 * What takes focus in a header cell: its sort button, else the cell.
 * @param {HTMLTableCellElement | undefined} cell
 * @returns {HTMLElement | null}
 */
function headerTarget(cell) {
  if (!cell) return null;
  return cell.querySelector("button.bx--table-sort") ?? cell;
}

/**
 * The element a navigation key moves focus to from `cell`, or `null` when
 * the key does nothing there. `cell` is a body cell `DataTable` gave a
 * `tabindex`, or a header cell (`th[data-header]`): the header row is the
 * grid's first row, and a header cell takes focus on its sort button when
 * it has one. `key` is the arrow key as an LTR page reads it (`ArrowRight`
 * is the next column in the DOM), so resolve it with `inlineKey` first. The
 * vertical arrows keep the column; `Home` and `End` go to the ends of the
 * row, and with `ctrl` to the first and last body cells.
 * @param {HTMLTableCellElement} cell
 * @param {string} key
 * @param {boolean} [ctrl]
 * @returns {HTMLElement | null}
 */
export function findCellTarget(cell, key, ctrl = false) {
  const table = cell.closest("table");
  const header = cell.tagName === "TH";
  const row = header
    ? (table?.querySelector("tbody tr[data-row]:not([hidden])") ?? null)
    : cell.parentElement;
  const cells = header ? headerCells(table) : navigableCells(row);
  const column = cells.indexOf(cell);
  if (column < 0) return null;

  const rows = navigableRows(row);
  // The header row sits above the first body row.
  const rowIndex = header ? -1 : rows.indexOf(/** @type {Element} */ (row));

  /** @param {number} index */
  const inRow = (index) => {
    if (index === -1) {
      const heads = headerCells(table);
      return headerTarget(heads[Math.min(column, heads.length - 1)]);
    }
    const target = rows[index];
    if (!target) return null;
    const targetCells = navigableCells(target);
    return targetCells[Math.min(column, targetCells.length - 1)] ?? null;
  };

  /** @param {HTMLTableCellElement | undefined} target */
  const inLine = (target) => (header ? headerTarget(target) : target) ?? null;

  switch (key) {
    case "ArrowRight":
      return inLine(cells[column + 1]);
    case "ArrowLeft":
      return inLine(cells[column - 1]);
    case "ArrowDown":
      return inRow(rowIndex + 1);
    case "ArrowUp":
      return rowIndex < 0 ? null : inRow(rowIndex - 1);
    case "Home":
      if (ctrl) return navigableCells(rows[0])[0] ?? null;
      return inLine(cells[0]);
    case "End": {
      if (!ctrl) return inLine(cells[cells.length - 1]);
      const last = navigableCells(rows[rows.length - 1]);
      return last[last.length - 1] ?? null;
    }
    default:
      return null;
  }
}
