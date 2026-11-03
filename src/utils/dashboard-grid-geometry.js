// @ts-check
// Geometry for `DashboardGrid`: how big a cell is, which cell a box is over,
// how many cells a size covers, and how fast to scroll near an edge.

/**
 * @typedef {import("./dashboard-grid-geometry.js").GridMetrics} GridMetrics
 */

/**
 * The size of each track in a computed `grid-template-columns` value, which
 * the browser has resolved to pixels.
 * @param {string} value
 * @returns {number[]}
 */
export function parseTrackSizes(value) {
  return value
    .split(" ")
    .map((token) => Number.parseFloat(token))
    .filter((size) => Number.isFinite(size));
}

/**
 * Read the cell size and the gaps from a laid-out grid.
 * @param {HTMLElement} grid
 * @returns {GridMetrics | null} `null` when the grid has no columns yet.
 */
export function readGrid(grid) {
  const style = getComputedStyle(grid);
  const columns = parseTrackSizes(style.gridTemplateColumns);
  const rowHeight =
    Number.parseFloat(style.gridAutoRows) ||
    parseTrackSizes(style.gridTemplateRows)[0];
  if (columns.length === 0 || !(rowHeight > 0) || !(columns[0] > 0))
    return null;
  const gapX = Number.parseFloat(style.columnGap) || 0;
  const gapY = Number.parseFloat(style.rowGap) || 0;
  return {
    cols: columns.length,
    columnWidth: columns[0],
    rowHeight,
    gapX,
    gapY,
    pitchX: columns[0] + gapX,
    pitchY: rowHeight + gapY,
    rtl: style.direction === "rtl",
  };
}

/**
 * The cell a distance from the grid's first cell falls in: the nearest one,
 * so a box is over the cell its top-left corner is closest to.
 * @param {number} offset - Distance in px from the first cell's edge.
 * @param {number} pitch - A cell plus one gap.
 * @param {number} count - Cells along the axis, or `Infinity`.
 * @returns {number}
 */
export function cellAt(offset, pitch, count) {
  return Math.min(Math.max(Math.round(offset / pitch), 0), count - 1);
}

/**
 * The cells a size covers.
 * @param {number} size - Size in px.
 * @param {number} track - One cell's size.
 * @param {number} gap
 * @returns {number}
 */
export function cellSpan(size, track, gap) {
  return Math.max(1, Math.round((size + gap) / (track + gap)));
}

/**
 * Scroll speed (px/s, signed) for a pointer near the edges of a scroll area.
 * Zero outside the edge zones, rising linearly toward the edge. `held` ramps
 * the speed up while the pointer stays in a zone, so brushing an edge on the
 * way to a drop does not fling the page.
 *
 * @param {object} options
 * @param {number} options.pointer - Pointer position along the axis.
 * @param {number} options.start - Start edge of the scroll area.
 * @param {number} options.end - End edge of the scroll area.
 * @param {number} [options.zone] - Edge zone size in px, capped at a third of
 *   the area so the middle never scrolls.
 * @param {number} [options.maxSpeed] - Top speed in px/s.
 * @param {number} [options.held] - ms the pointer has been in a zone.
 * @param {number} [options.ramp] - ms to reach full speed.
 * @returns {number}
 */
export function edgeScrollSpeed({
  pointer,
  start,
  end,
  zone = 64,
  maxSpeed = 900,
  held = Number.POSITIVE_INFINITY,
  ramp = 400,
}) {
  const edge = Math.min(zone, Math.max(end - start, 0) / 3);
  if (edge <= 0) return 0;
  const warm = 0.15 + 0.85 * Math.min(held / ramp, 1);
  if (pointer < start + edge) {
    const depth = Math.min((start + edge - pointer) / edge, 1.5);
    return -maxSpeed * depth * warm;
  }
  if (pointer > end - edge) {
    const depth = Math.min((pointer - (end - edge)) / edge, 1.5);
    return maxSpeed * depth * warm;
  }
  return 0;
}
