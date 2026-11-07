// @ts-check

/**
 * @typedef {object} IndexedLayout
 * @property {ReadonlyArray<number>} counts Items per section, empty ones included.
 * @property {number} itemHeight
 * @property {number} headerHeight
 * @property {number[]} sections The sections that hold items, in order.
 * @property {number[]} starts The offset of each of those sections' header.
 * @property {number[]} offsets The offset of every section's header, or -1 for an empty one.
 * @property {number} total The height of every header and item.
 */

/**
 * Lay out sections of equal-height items, each under a header of its own
 * height. An empty section has no header and no height, so a jump to it has
 * nowhere to land.
 *
 * Sizes are fixed, so an offset is arithmetic and nothing is measured.
 *
 * @param {ReadonlyArray<number>} counts
 * @param {number} itemHeight
 * @param {number} headerHeight
 * @returns {IndexedLayout}
 */
export function buildIndexedLayout(counts, itemHeight, headerHeight) {
  /** @type {number[]} */
  const sections = [];
  /** @type {number[]} */
  const starts = [];
  /** @type {number[]} */
  const offsets = [];
  let total = 0;
  for (let section = 0; section < counts.length; section++) {
    if (counts[section] > 0) {
      sections.push(section);
      starts.push(total);
      offsets.push(total);
      total += headerHeight + counts[section] * itemHeight;
    } else {
      offsets.push(-1);
    }
  }
  return { counts, itemHeight, headerHeight, sections, starts, offsets, total };
}

/**
 * The position, among the sections that hold items, of the one an offset
 * falls in: the last whose header starts at or above it. `-1` when no
 * section holds items.
 *
 * @param {IndexedLayout} layout
 * @param {number} offset
 * @returns {number}
 */
export function positionAt(layout, offset) {
  const { starts } = layout;
  if (starts.length === 0) return -1;
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (starts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return low;
}

/**
 * @typedef {{ type: "header", section: number, key: string }
 *   | { type: "item", section: number, index: number, key: string }} IndexedRow
 */

/**
 * @typedef {object} IndexedWindow
 * @property {IndexedRow[]} rows The rows to render, top to bottom.
 * @property {number} before Space above the first row, in pixels.
 * @property {number} after Space below the last row, in pixels.
 * @property {number} section The section whose header is at the top of the
 *   viewport, or -1 when no section holds items.
 */

/**
 * The rows to render for a scroll position: the viewport plus `overscan`
 * pixels either side, and the header of the section at the top.
 *
 * The header at the top is always among the rows, even when the window starts
 * well below it, because a sticky header only sticks while it is in the DOM.
 * It comes first, so the order is the document's, and `before` leaves room
 * for it.
 *
 * `lead` is how far the last scroll moved, signed. The window reaches that
 * much further the way the reader is going, up to a viewport, so a scroll
 * that the compositor paints ahead of the page still lands on rows.
 *
 * @param {IndexedLayout} layout
 * @param {number} scrollTop
 * @param {number} viewport
 * @param {number} overscan
 * @param {number} [lead]
 * @returns {IndexedWindow}
 */
export function getIndexedWindow(
  layout,
  scrollTop,
  viewport,
  overscan,
  lead = 0,
) {
  const { sections, starts, counts, itemHeight, headerHeight, total } = layout;
  if (sections.length === 0)
    return { rows: [], before: 0, after: 0, section: -1 };

  // A scroller never rests past its end.
  const offset = Math.min(
    Math.max(scrollTop, 0),
    Math.max(total - viewport, 0),
  );
  const ahead = Math.min(Math.abs(lead), viewport);
  const top = Math.max(0, offset - overscan - (lead < 0 ? ahead : 0));
  const bottom = Math.min(
    total,
    offset + viewport + overscan + (lead > 0 ? ahead : 0),
  );
  const current = positionAt(layout, offset);

  /** @type {IndexedRow[]} */
  const rows = [];
  let first = -1;
  let end = 0;
  for (
    let position = positionAt(layout, top);
    position < sections.length && starts[position] < bottom;
    position++
  ) {
    const section = sections[position];
    const start = starts[position];
    const body = start + headerHeight;
    if (body > top) {
      if (first < 0) first = start;
      rows.push({ type: "header", section, key: `h${section}` });
      end = body;
    }
    const from = Math.max(0, Math.floor((top - body) / itemHeight));
    const to = Math.min(
      counts[section],
      Math.ceil((bottom - body) / itemHeight),
    );
    for (let index = from; index < to; index++) {
      if (first < 0) first = body + index * itemHeight;
      rows.push({ type: "item", section, index, key: `i${section}:${index}` });
      end = body + (index + 1) * itemHeight;
    }
  }

  const stuck = sections[current];
  let before = Math.max(first, 0);
  if (!rows.some((row) => row.type === "header" && row.section === stuck)) {
    rows.unshift({ type: "header", section: stuck, key: `h${stuck}` });
    before = Math.max(before - headerHeight, 0);
  }
  return { rows, before, after: Math.max(total - end, 0), section: stuck };
}
