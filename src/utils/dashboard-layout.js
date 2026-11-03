// @ts-check
// Pure layout model for `DashboardGrid`: items on a column grid, compaction,
// collision resolution, and the moves and resizes built on them. No DOM and no
// Svelte, so it runs on the server and in a worker. Every function returns new
// objects and never changes its input.

import { breakpoints } from "../Breakpoint/breakpoints.js";

/**
 * @typedef {import("./dashboard-layout.js").DashboardGridLayoutItem} Item
 * @typedef {import("./dashboard-layout.js").DashboardGridLayoutOptions} Options
 */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * A whole number at least `min`. Anything that is not a finite number falls
 * back to `fallback`, so a layout read from storage cannot break the grid.
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 */
function whole(value, fallback, min) {
  const n =
    typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
  return Math.max(min, Number.isNaN(n) ? fallback : Math.round(n));
}

/**
 * Coerce `item` into the grid: whole numbers, a width of 1 to `cols`, a
 * height of at least 1, `minW`/`maxW`/`minH`/`maxH` respected, and a position
 * inside the columns.
 *
 * @param {Item} item
 * @param {number} cols
 * @returns {Item}
 */
export function normalizeItem(item, cols) {
  const minW = Math.min(whole(item.minW, 1, 1), cols);
  const maxW = Math.min(whole(item.maxW, cols, minW), cols);
  const minH = whole(item.minH, 1, 1);
  const maxH = whole(item.maxH, Number.POSITIVE_INFINITY, minH);
  const w = clamp(whole(item.w, minW, 1), minW, maxW);
  const h = clamp(whole(item.h, minH, 1), minH, maxH);
  /** @type {Item} */
  const next = {
    id: item.id,
    x: clamp(whole(item.x, 0, 0), 0, cols - w),
    y: whole(item.y, 0, 0),
    w,
    h,
  };
  if (item.minW !== undefined) next.minW = minW;
  if (item.maxW !== undefined) next.maxW = maxW;
  if (item.minH !== undefined) next.minH = minH;
  if (item.maxH !== undefined) next.maxH = maxH;
  if (item.static) next.static = true;
  return next;
}

/**
 * Normalize every item. A repeated `id` keeps its first item.
 *
 * @param {ReadonlyArray<Item>} layout
 * @param {number} cols
 * @returns {Item[]}
 */
export function normalizeLayout(layout, cols) {
  const seen = new Set();
  /** @type {Item[]} */
  const out = [];
  for (const item of layout) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(normalizeItem(item, cols));
  }
  return out;
}

/**
 * @param {Item} a
 * @param {Item} b
 */
function collides(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/**
 * @param {ReadonlyArray<Item>} placed
 * @param {Item} item
 * @returns {Item | undefined}
 */
function firstCollision(placed, item) {
  for (const other of placed) if (collides(item, other)) return other;
  return undefined;
}

/**
 * @param {ReadonlyArray<Item>} layout
 * @returns {number}
 */
function bottom(layout) {
  let max = 0;
  for (const item of layout) max = Math.max(max, item.y + item.h);
  return max;
}

/**
 * The number of rows the layout occupies.
 *
 * @param {ReadonlyArray<Item>} layout
 * @returns {number}
 */
export function layoutRows(layout) {
  return bottom(layout);
}

/**
 * Settle a layout: no two items overlap and, with `compact: "vertical"`, every
 * item rests against the top or the item above it. Static items never move,
 * and every other item is placed around them. Items are placed from the top
 * row down, left to right. On a tie in the row, `priority` goes first, which
 * is how a dragged item takes the place of the one it lands on.
 *
 * @param {ReadonlyArray<Item>} layout - Normalized items.
 * @param {"vertical" | "none"} compact
 * @param {string | undefined} priority - Id of the item that wins a tie.
 * @returns {Item[]}
 */
function settle(layout, compact, priority) {
  const placed = layout.filter((item) => item.static);
  const order = layout
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.static)
    .sort(
      (a, b) =>
        a.item.y - b.item.y ||
        Number(b.item.id === priority) - Number(a.item.id === priority) ||
        a.item.x - b.item.x ||
        a.index - b.index,
    );
  /** @type {Map<string, Item>} */
  const settled = new Map();

  for (const { item } of order) {
    const next = { ...item };
    if (compact === "vertical") {
      next.y = Math.min(bottom(placed), next.y);
      while (next.y > 0) {
        next.y--;
        if (firstCollision(placed, next)) {
          next.y++;
          break;
        }
      }
    }
    for (
      let hit = firstCollision(placed, next);
      hit;
      hit = firstCollision(placed, next)
    ) {
      next.y = hit.y + hit.h;
    }
    placed.push(next);
    settled.set(next.id, next);
  }
  return layout.map((item) => settled.get(item.id) ?? item);
}

/**
 * Normalize a layout and settle it. Use it for a layout you wrote by hand or
 * read from storage, and to derive the layout for a narrower breakpoint.
 *
 * @param {ReadonlyArray<Item>} layout
 * @param {number} cols
 * @param {"vertical" | "none"} [compact="vertical"]
 * @returns {Item[]}
 */
export function compactLayout(layout, cols, compact = "vertical") {
  return settle(normalizeLayout(layout, cols), compact, undefined);
}

/**
 * Sort in reading order: top to bottom, then start to end. Returns a copy.
 *
 * @param {ReadonlyArray<Item>} layout
 * @returns {Item[]}
 */
export function sortLayout(layout) {
  return layout
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) => a.item.y - b.item.y || a.item.x - b.item.x || a.index - b.index,
    )
    .map(({ item }) => item);
}

/**
 * @param {ReadonlyArray<Item>} layout
 * @param {number} index - The changed item.
 * @param {Item} changed - Its new geometry.
 * @param {Options} options
 * @returns {Item[] | null} `null` when the change cannot be made.
 */
function place(layout, index, changed, options) {
  const compact = options.compact ?? "vertical";
  const next = layout.slice();
  next[index] = changed;
  for (let i = 0; i < next.length; i++) {
    if (i === index) continue;
    const other = next[i];
    if (!collides(changed, other)) continue;
    // A static item never gives way, and `"prevent"` gives way for nobody.
    if (other.static || options.collision === "prevent") return null;
  }
  return settle(next, compact, changed.id);
}

/**
 * @param {ReadonlyArray<Item>} layout
 * @param {string} id
 */
function indexOfId(layout, id) {
  return layout.findIndex((item) => item.id === id);
}

/**
 * Move an item so its top-left cell is `x`, `y`. Items it lands on are pushed
 * down, and then the layout settles. The item can end elsewhere than the cell
 * you asked for: with `compact: "vertical"` it rests against the item above.
 *
 * Returns `layout` itself when the move cannot be made: the item is static,
 * the cell is taken by a static item, or the cell is taken and `collision` is
 * `"prevent"`.
 *
 * @param {ReadonlyArray<Item>} layout - A normalized layout.
 * @param {string} id
 * @param {number} x
 * @param {number} y
 * @param {Options} options
 * @returns {Item[]}
 */
export function moveLayoutItem(layout, id, x, y, options) {
  const index = indexOfId(layout, id);
  const item = layout[index];
  const out = /** @type {Item[]} */ (layout);
  if (!item || item.static) return out;
  const changed = {
    ...item,
    x: clamp(Math.round(x), 0, options.cols - item.w),
    y: Math.max(0, Math.round(y)),
  };
  return place(layout, index, changed, options) ?? out;
}

/**
 * Resize an item to `w` columns by `h` rows, within its `minW`, `maxW`,
 * `minH` and `maxH` and the columns to its end. Items in the way are pushed
 * down. Returns `layout` itself when the resize cannot be made, for the
 * reasons `moveLayoutItem` lists.
 *
 * @param {ReadonlyArray<Item>} layout - A normalized layout.
 * @param {string} id
 * @param {number} w
 * @param {number} h
 * @param {Options} options
 * @returns {Item[]}
 */
export function resizeLayoutItem(layout, id, w, h, options) {
  const index = indexOfId(layout, id);
  const item = layout[index];
  const out = /** @type {Item[]} */ (layout);
  if (!item || item.static) return out;
  const minW = item.minW ?? 1;
  const maxW = Math.min(item.maxW ?? options.cols, options.cols - item.x);
  const minH = item.minH ?? 1;
  const maxH = item.maxH ?? Number.POSITIVE_INFINITY;
  const changed = {
    ...item,
    w: clamp(Math.round(w), minW, maxW),
    h: clamp(Math.round(h), minH, maxH),
  };
  if (changed.w === item.w && changed.h === item.h) return out;
  return place(layout, index, changed, options) ?? out;
}

/**
 * Move an item one step: the nearest position in that direction that changes
 * the layout. A plain one-cell move often changes nothing, because a
 * vertically compacted item that moves down into an empty row falls back, and
 * one that moves down onto a neighbour is pushed back up by it. So the step
 * keeps going until the item reaches the position that counts, such as past
 * the neighbour it swaps with. Returns `layout` itself when there is no such
 * position.
 *
 * @param {ReadonlyArray<Item>} layout - A normalized layout.
 * @param {string} id
 * @param {-1 | 0 | 1} dx - Columns, positive toward the higher column.
 * @param {-1 | 0 | 1} dy - Rows, positive toward the higher row.
 * @param {Options} options
 * @returns {Item[]}
 */
export function nudgeLayoutItem(layout, id, dx, dy, options) {
  const item = layout.find((candidate) => candidate.id === id);
  const out = /** @type {Item[]} */ (layout);
  if (!item || item.static || (dx === 0 && dy === 0)) return out;
  const limit = dy === 0 ? options.cols : bottom(layout) + item.h + 1;
  for (let step = 1; step <= limit; step++) {
    const x = item.x + dx * step;
    const y = item.y + dy * step;
    if (x < 0 || x > options.cols - item.w || y < 0) break;
    const next = moveLayoutItem(layout, id, x, y, options);
    if (next === layout) continue;
    // Compaction can settle every item where it began.
    if (differs(layout, next)) return next;
  }
  return out;
}

/**
 * @param {ReadonlyArray<Item>} a
 * @param {ReadonlyArray<Item>} b
 */
function differs(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i].x !== b[i].x || a[i].y !== b[i].y) return true;
  }
  return false;
}

/**
 * Whether two layouts put every item in the same place at the same size.
 *
 * @param {ReadonlyArray<Item>} a
 * @param {ReadonlyArray<Item>} b
 * @returns {boolean}
 */
export function layoutsEqual(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    if (
      p.id !== q.id ||
      p.x !== q.x ||
      p.y !== q.y ||
      p.w !== q.w ||
      p.h !== q.h
    )
      return false;
  }
  return true;
}

/**
 * Bring a stored layout in line with the widgets you have now. An id in
 * `stored` that `defaults` does not know is dropped, and an id only
 * `defaults` has is added with its default place. Size limits and `static`
 * come from `defaults`, so a new release can change them. Input that is not a
 * layout gives `defaults`.
 *
 * @param {unknown} stored
 * @param {ReadonlyArray<Item>} defaults
 * @returns {Item[]}
 */
export function reconcileLayout(stored, defaults) {
  if (!Array.isArray(stored)) return defaults.map((item) => ({ ...item }));
  /** @type {Map<string, Record<string, unknown>>} */
  const byId = new Map();
  for (const entry of stored) {
    if (
      entry &&
      typeof entry === "object" &&
      typeof entry.id === "string" &&
      !byId.has(entry.id)
    )
      byId.set(entry.id, entry);
  }
  return defaults.map((fallback) => {
    const entry = byId.get(fallback.id);
    if (!entry) return { ...fallback };
    return {
      ...fallback,
      x: whole(entry.x, fallback.x, 0),
      y: whole(entry.y, fallback.y, 0),
      w: whole(entry.w, fallback.w, 1),
      h: whole(entry.h, fallback.h, 1),
    };
  });
}

/** @typedef {import("../Breakpoint/breakpoints.js").BreakpointSize} BreakpointSize */

/**
 * The breakpoints a grid has a layout for, smallest first. They are the
 * Carbon grid breakpoints.
 * @type {ReadonlyArray<BreakpointSize>}
 */
export const DASHBOARD_BREAKPOINTS = ["sm", "md", "lg", "xlg", "max"];

/**
 * The columns of the Carbon grid at each breakpoint.
 * @type {Readonly<Record<BreakpointSize, number>>}
 */
export const DASHBOARD_DEFAULT_COLS = Object.freeze({
  sm: 4,
  md: 8,
  lg: 16,
  xlg: 16,
  max: 16,
});

/**
 * The Carbon breakpoint for a viewport width, as the media queries pick it.
 *
 * @param {number} width - A viewport width in px, scrollbar included.
 * @returns {BreakpointSize}
 */
export function breakpointAt(width) {
  let found = DASHBOARD_BREAKPOINTS[0];
  for (const bp of DASHBOARD_BREAKPOINTS)
    if (width >= breakpoints[bp]) found = bp;
  return found;
}

/**
 * Columns at every breakpoint. A number is the same at all of them, and a
 * breakpoint left out of an object keeps the Carbon grid's count.
 *
 * @param {number | Partial<Record<BreakpointSize, number>> | undefined} cols
 * @returns {Record<BreakpointSize, number>}
 */
export function resolveColumns(cols) {
  const out = { ...DASHBOARD_DEFAULT_COLS };
  for (const bp of DASHBOARD_BREAKPOINTS) {
    const value = typeof cols === "number" ? cols : cols?.[bp];
    if (typeof value === "number" && Number.isFinite(value))
      out[bp] = Math.max(1, Math.round(value));
  }
  return out;
}

/**
 * The layout at every breakpoint. A layout you give is normalized and
 * otherwise left as it is. A breakpoint with none takes the nearest larger
 * breakpoint's layout, else the nearest smaller one's, fitted to its columns
 * and settled. With no layout at all, every breakpoint is empty.
 *
 * @param {Partial<Record<BreakpointSize, ReadonlyArray<Item>>>} given
 * @param {Record<BreakpointSize, number>} cols
 * @param {"vertical" | "none"} [compact="vertical"]
 * @returns {Record<BreakpointSize, Item[]>}
 */
export function resolveLayouts(given, cols, compact = "vertical") {
  const order = DASHBOARD_BREAKPOINTS;
  /** @type {Partial<Record<BreakpointSize, Item[]>>} */
  const out = {};
  for (const bp of order) {
    const own = given[bp];
    if (Array.isArray(own)) out[bp] = normalizeLayout(own, cols[bp]);
  }
  for (let i = 0; i < order.length; i++) {
    const bp = order[i];
    if (out[bp]) continue;
    // Look up the breakpoints first, then down.
    const donor =
      order.slice(i + 1).find((other) => Array.isArray(given[other])) ??
      order
        .slice(0, i)
        .reverse()
        .find((other) => Array.isArray(given[other]));
    out[bp] = donor
      ? compactLayout(
          /** @type {ReadonlyArray<Item>} */ (given[donor]),
          cols[bp],
          compact,
        )
      : [];
  }
  return /** @type {Record<BreakpointSize, Item[]>} */ (out);
}

/**
 * The CSS custom properties that place each item at each breakpoint, by item
 * id. A property is written only where the cell differs from the breakpoint
 * below, so an item that does not move across breakpoints carries one. The
 * values are numbers from a normalized layout.
 *
 * @param {Record<BreakpointSize, ReadonlyArray<Item>>} lists
 * @returns {Map<string, string>}
 */
export function placementStyles(lists) {
  /** @type {Map<string, string>} */
  const styles = new Map();
  /** @type {Map<string, string>} */
  const last = new Map();
  for (const bp of DASHBOARD_BREAKPOINTS) {
    for (const item of lists[bp]) {
      const cell = `${item.y + 1} / ${item.x + 1} / span ${item.h} / span ${item.w}`;
      if (last.get(item.id) === cell) continue;
      last.set(item.id, cell);
      styles.set(
        item.id,
        `${styles.get(item.id) ?? ""}--ccs-dg-${bp}:${cell};`,
      );
    }
  }
  return styles;
}
