// @ts-check
// DataTable draws its rows but has no row interaction model: a `<tr>` is
// neither focusable, selectable by `aria-selected`, nor draggable, and
// DataTable offers no prop to add attributes to one. This action stamps them
// from outside, onto the rows that are mounted, and again whenever the window
// of a virtualized table changes. Svelte never writes these attributes, so
// DataTable's own updates do not undo them.

/**
 * @typedef {Object} FileRowsOptions
 * @property {ReadonlyArray<string>} selected
 * @property {string} cursor - The row that holds the tab stop.
 * @property {boolean} draggable
 * @property {(id: string) => number} indexOf - Position of a row in the whole list, for `aria-rowindex`.
 * @property {number} count - Rows in the whole list.
 */

/**
 * @param {HTMLElement} node - Holds the DataTable.
 * @param {FileRowsOptions} options
 */
export function fileRows(node, options) {
  let current = options;

  function stamp() {
    const selected = new Set(current.selected);
    const rows = node.querySelectorAll("tr[data-row]");
    let cursorMounted = false;
    for (const row of rows) {
      if (row.getAttribute("data-row") === current.cursor) cursorMounted = true;
    }
    let first = true;
    for (const row of rows) {
      const id = /** @type {string} */ (row.getAttribute("data-row"));
      const isCursor = cursorMounted ? id === current.cursor : first;
      first = false;
      row.setAttribute("aria-selected", selected.has(id) ? "true" : "false");
      row.setAttribute("tabindex", isCursor ? "0" : "-1");
      row.setAttribute("aria-rowindex", String(current.indexOf(id) + 2));
      if (current.draggable) row.setAttribute("draggable", "true");
      else row.removeAttribute("draggable");
      if (id === current.cursor) row.setAttribute("data-cursor", "");
      else row.removeAttribute("data-cursor");
      row.setAttribute("data-file-row", "");
      // One tab stop for the whole list: the row that holds it. The row
      // checkboxes stay clickable, and Space on a row toggles it.
      for (const input of row.querySelectorAll("input")) {
        if (input.tabIndex !== -1) input.tabIndex = -1;
      }
    }
    const table = node.querySelector("table");
    if (table) {
      table.setAttribute("aria-rowcount", String(current.count + 1));
    }
  }

  // A virtualized table swaps rows as it scrolls. Observing childList only,
  // so the attributes written here do not wake the observer again.
  const observer = new MutationObserver(stamp);
  observer.observe(node, { childList: true, subtree: true });
  stamp();

  return {
    /** @param {FileRowsOptions} next */
    update(next) {
      current = next;
      stamp();
    },
    destroy() {
      observer.disconnect();
    },
  };
}
