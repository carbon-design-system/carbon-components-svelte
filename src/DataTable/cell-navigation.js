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
 * The cell a navigation key moves focus to from `cell`, or `null` when the
 * key does nothing there. `key` is the arrow key as an LTR page reads it
 * (`ArrowRight` is the next column in the DOM), so resolve it with
 * `inlineKey` first. The vertical arrows keep the column; `Home` and `End`
 * go to the ends of the row, and with `ctrl` to the ends of the table.
 * @param {HTMLTableCellElement} cell
 * @param {string} key
 * @param {boolean} [ctrl]
 * @returns {HTMLTableCellElement | null}
 */
export function findCellTarget(cell, key, ctrl = false) {
  const row = cell.parentElement;
  const cells = navigableCells(row);
  const column = cells.indexOf(cell);
  if (column < 0) return null;

  const rows = navigableRows(row);
  const rowIndex = rows.indexOf(/** @type {Element} */ (row));

  /** @param {number} index */
  const inRow = (index) => {
    const target = rows[index];
    if (!target) return null;
    const targetCells = navigableCells(target);
    return targetCells[Math.min(column, targetCells.length - 1)] ?? null;
  };

  switch (key) {
    case "ArrowRight":
      return cells[column + 1] ?? null;
    case "ArrowLeft":
      return cells[column - 1] ?? null;
    case "ArrowDown":
      return inRow(rowIndex + 1);
    case "ArrowUp":
      return inRow(rowIndex - 1);
    case "Home":
      return ctrl ? (navigableCells(rows[0])[0] ?? null) : (cells[0] ?? null);
    case "End": {
      if (!ctrl) return cells[cells.length - 1] ?? null;
      const last = navigableCells(rows[rows.length - 1]);
      return last[last.length - 1] ?? null;
    }
    default:
      return null;
  }
}
