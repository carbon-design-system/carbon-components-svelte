// @ts-check

/**
 * Place a menu along one viewport axis. It opens toward the axis's far end
 * from `after` (a pointer, or the anchor's far edge), and back from `before`
 * (the anchor's near edge) when it doesn't fit there. When it fits on
 * neither side, it pins to the far edge, so it stays on screen.
 *
 * `reverse` swaps the preference: back from `before` first, then from
 * `after`, else pinned to the near edge. On the inline axis of an RTL page,
 * the far edge is the left one.
 *
 * @param {Object} options
 * @param {number} options.before - Near edge of the anchor (left or top).
 * @param {number} options.after - Far edge of the anchor (right or bottom). Equal to `before` for a pointer.
 * @param {number} options.size - The menu's length along the axis.
 * @param {number} options.max - The viewport's length along the axis.
 * @param {boolean} [options.reverse=false]
 * @returns {number} The menu's near edge (its `left` or `top`).
 */
export function fitMenuAxis({ before, after, size, max, reverse = false }) {
  const forward = after + size <= max ? after : null;
  const backward = before - size >= 0 ? before - size : null;
  if (reverse) return backward ?? forward ?? Math.min(0, max - size);
  return forward ?? backward ?? Math.max(0, max - size);
}

/**
 * The physical side of a `start` or `end` alignment along the inline axis.
 * They swap in RTL, where the inline start is the right. `center` stays.
 *
 * @param {"start" | "center" | "end"} align
 * @param {boolean} rtl
 * @returns {"start" | "center" | "end"} `start` for the left edge, `end` for the right.
 */
export function physicalAlign(align, rtl) {
  if (!rtl || align === "center") return align;
  return align === "start" ? "end" : "start";
}
