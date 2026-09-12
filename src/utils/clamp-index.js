// @ts-check
// Clamped index movement for keyboard navigation. Stops at the ends instead of wrapping.

/**
 * Move `index` by `step` and clamp to `[0, length - 1]`. Returns -1 for an empty range.
 * From `index` of -1, moving up enters at the last item and moving down at the first.
 *
 * @param {number} index
 * @param {number} step
 * @param {number} length
 * @returns {number}
 */
export function clampIndex(index, step, length) {
  if (length <= 0) return -1;
  if (index < 0) return step < 0 ? length - 1 : 0;
  const next = index + step;
  return Math.min(Math.max(next, 0), length - 1);
}
