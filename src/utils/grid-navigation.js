// @ts-check
// Two-dimensional keyboard navigation over a `GridLayout`, as a pure function
// and as a Svelte action. The action only reports the next index: the caller
// decides whether it moves DOM focus (a roving tabindex) or an
// `aria-activedescendant`, so a search field can keep focus.

/** @typedef {import("./grid-layout.js").GridLayout} GridLayout */

/**
 * @typedef {Object} GridMove
 * @property {number} index - The cell to move to.
 * @property {number} column - The column to aim for on the next vertical move.
 */

/**
 * The keys `moveGridIndex` answers to.
 */
export const GRID_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
];

/**
 * Where `key` takes the cursor. Left and right step one cell and carry on
 * into the next line, up and down keep the column (a short last line clamps
 * to its end, and the column comes back on the next line), Home and End go
 * to the ends of the line, and with `ctrl` to the ends of the grid. Page
 * keys move `pageRows` lines. Nothing wraps: an arrow at an edge stays put.
 *
 * `key` is the key as an LTR page reads it, so resolve RTL before calling
 * (see `inlineKey`).
 *
 * @param {Object} options
 * @param {GridLayout} options.layout
 * @param {number} options.index - The cell the cursor is on. `-1` when none, which enters at the first cell, or at the last one for ArrowUp, End and PageUp.
 * @param {string} options.key
 * @param {number} [options.column] - The column to keep on vertical moves. Default: the column of `index`.
 * @param {boolean} [options.ctrl] - Home and End go to the ends of the grid.
 * @param {number} [options.pageRows] - Lines a page key moves. Default 1.
 * @returns {GridMove | null} `null` when `key` is not a grid key or the grid is empty.
 */
export function moveGridIndex({
  layout,
  index,
  key,
  column,
  ctrl = false,
  pageRows = 1,
}) {
  const { itemCount, lineRows, itemLine, itemColumn, rows } = layout;
  if (itemCount === 0 || !GRID_KEYS.includes(key)) return null;
  const last = itemCount - 1;

  if (index < 0 || index > last) {
    const toEnd = key === "ArrowUp" || key === "End" || key === "PageUp";
    const entry = toEnd ? last : 0;
    return { index: entry, column: itemColumn[entry] };
  }

  const line = itemLine[index];
  const lineCount = lineRows.length;
  const goal = column ?? itemColumn[index];
  const lineAt = (/** @type {number} */ at) => rows[lineRows[at]];

  /** @param {number} target */
  const vertical = (target) => {
    const next = Math.min(Math.max(target, 0), lineCount - 1);
    if (next === line) return { index, column: goal };
    const row = lineAt(next);
    return {
      index: row.start + Math.min(goal, row.length - 1),
      column: goal,
    };
  };

  /** @param {number} next */
  const horizontal = (next) => {
    const clamped = Math.min(Math.max(next, 0), last);
    return { index: clamped, column: itemColumn[clamped] };
  };

  switch (key) {
    case "ArrowRight":
      return horizontal(index + 1);
    case "ArrowLeft":
      return horizontal(index - 1);
    case "ArrowDown":
      return vertical(line + 1);
    case "ArrowUp":
      return vertical(line - 1);
    case "PageDown":
      return vertical(line + Math.max(1, pageRows));
    case "PageUp":
      return vertical(line - Math.max(1, pageRows));
    case "Home": {
      if (ctrl) return horizontal(0);
      return horizontal(lineAt(line).start);
    }
    default: {
      if (ctrl) return horizontal(last);
      const row = lineAt(line);
      return horizontal(row.start + row.length - 1);
    }
  }
}

/**
 * @typedef {Object} GridNavOptions
 * @property {() => GridLayout} getLayout
 * @property {() => number} getIndex - The cell the cursor is on, or `-1`.
 * @property {(index: number, event: KeyboardEvent) => void} onMove
 * @property {() => boolean} [rtl] - Read on each horizontal arrow key. When it returns `true`, ArrowLeft moves to the next cell.
 * @property {() => number} [getPageRows] - Lines a page key moves. Default 1.
 * @property {(event: KeyboardEvent) => boolean} [shouldHandle] - Return `false` to leave a key to the element, such as the caret keys of a search field with text in it.
 */

/**
 * Svelte action: arrow, Home, End and page keys on `node` report the next
 * cell through `onMove`. Handled keys call `preventDefault`. The column a
 * vertical move aims for survives until another key moves the cursor, or
 * the cursor is moved from outside.
 *
 * @param {HTMLElement} node
 * @param {GridNavOptions} options
 */
export function gridNav(node, options) {
  let current = options;
  /** @type {number | undefined} */
  let column;
  let lastIndex = -2;

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return;
    // Shift is left to the element (text selection), Alt and Meta to the browser.
    if (event.altKey || event.metaKey || event.shiftKey) return;
    if (current.shouldHandle && !current.shouldHandle(event)) return;
    if (event.ctrlKey && event.key !== "Home" && event.key !== "End") return;

    let key = event.key;
    if (
      (key === "ArrowLeft" || key === "ArrowRight") &&
      current.rtl?.() === true
    ) {
      key = key === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
    }

    const index = current.getIndex();
    if (index !== lastIndex) column = undefined;
    const move = moveGridIndex({
      layout: current.getLayout(),
      index,
      key,
      column,
      ctrl: event.ctrlKey,
      pageRows: current.getPageRows?.() ?? 1,
    });
    if (!move) return;

    event.preventDefault();
    const vertical = key === "ArrowUp" || key === "ArrowDown";
    const page = key === "PageUp" || key === "PageDown";
    column = vertical || page ? move.column : undefined;
    lastIndex = move.index;
    current.onMove(move.index, event);
  }

  node.addEventListener("keydown", handleKeydown);

  return {
    /** @param {GridNavOptions} update */
    update(update) {
      current = update;
    },
    destroy() {
      node.removeEventListener("keydown", handleKeydown);
    },
  };
}
