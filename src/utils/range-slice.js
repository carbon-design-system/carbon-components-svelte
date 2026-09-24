// @ts-check

/**
 * Items between `anchorIndex` and `targetIndex` (inclusive, either
 * order) in list order, keeping only those that pass `isEligible`.
 * Returns `null` when the anchor is missing (`anchorIndex` of -1).
 *
 * Used for Shift+click and Shift+Arrow range selection.
 *
 * @template T
 * @param {ReadonlyArray<T>} items
 * @param {number} anchorIndex
 * @param {number} targetIndex
 * @param {(item: T) => boolean} [isEligible]
 * @returns {T[] | null}
 */
export function rangeSlice(items, anchorIndex, targetIndex, isEligible) {
  if (anchorIndex === -1) return null;
  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  const slice = items.slice(start, end + 1);
  return isEligible ? slice.filter(isEligible) : slice;
}
