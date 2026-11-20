// @ts-check
// Where an arrow, Home, End or page key takes the cursor in a grid of equal
// cells laid out in lines of `columns`. The moves are PickerGrid's
// (`moveGridIndex`), reduced to one section with no headers, so the layout is
// arithmetic instead of a table of lines.

/** The keys `moveGridCursor` answers to. */
export const GRID_CURSOR_KEYS = [
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
 * Left and right step one cell and carry on into the next line. Up and down
 * keep the column, and a short last line clamps to its end. Home and End go
 * to the ends of the line, and with `ctrl` to the ends of the grid. Page keys
 * move `pageRows` lines. Nothing wraps.
 *
 * `key` is the key as an LTR page reads it, so swap Left and Right under RTL
 * first (see `inlineGridKey`).
 *
 * @param {Object} options
 * @param {number} options.index - The cell the cursor is on, or `-1`, which enters at the first cell or, for ArrowUp, End and PageUp, the last.
 * @param {number} options.count
 * @param {number} options.columns
 * @param {string} options.key
 * @param {boolean} [options.ctrl]
 * @param {number} [options.pageRows]
 * @param {number} [options.column] - The column to aim for on a vertical move. Default: the column of `index`.
 * @returns {{ index: number, column: number } | null} `null` for a key that is not a grid key, or an empty grid.
 */
export function moveGridCursor({
  index,
  count,
  columns,
  key,
  ctrl = false,
  pageRows = 1,
  column,
}) {
  if (count <= 0 || !GRID_CURSOR_KEYS.includes(key)) return null;
  const width = Math.max(1, Math.floor(columns) || 1);
  const last = count - 1;
  const lines = Math.ceil(count / width);

  if (index < 0 || index > last) {
    const toEnd = key === "ArrowUp" || key === "End" || key === "PageUp";
    const entry = toEnd ? last : 0;
    return { index: entry, column: entry % width };
  }

  const line = Math.floor(index / width);
  const goal = column ?? index % width;

  /** @param {number} target */
  const vertical = (target) => {
    const next = Math.min(Math.max(target, 0), lines - 1);
    if (next === line) return { index, column: goal };
    return { index: Math.min(next * width + goal, last), column: goal };
  };
  /** @param {number} next */
  const horizontal = (next) => {
    const clamped = Math.min(Math.max(next, 0), last);
    return { index: clamped, column: clamped % width };
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
    case "Home":
      return horizontal(ctrl ? 0 : line * width);
    default:
      return horizontal(ctrl ? last : Math.min(line * width + width - 1, last));
  }
}

/**
 * Swap Left and Right under RTL, so a move follows the reading direction.
 * @param {string} key
 * @param {boolean} rtl
 */
export function inlineGridKey(key, rtl) {
  if (!rtl) return key;
  if (key === "ArrowLeft") return "ArrowRight";
  if (key === "ArrowRight") return "ArrowLeft";
  return key;
}
