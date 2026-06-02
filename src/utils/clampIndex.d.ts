/**
 * Clamped index movement for keyboard navigation. Stops at the ends instead of wrapping.
 */

/**
 * Move `index` by `step` and clamp to `[0, length - 1]`. Returns -1 for an empty range.
 * From `index` of -1, moving up enters at the last item and moving down at the first.
 */
export function clampIndex(index: number, step: number, length: number): number;
