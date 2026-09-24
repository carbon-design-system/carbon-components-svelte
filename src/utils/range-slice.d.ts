/**
 * Items between `anchorIndex` and `targetIndex` (inclusive, either
 * order) in list order, keeping only those that pass `isEligible`.
 * Returns `null` when the anchor is missing (`anchorIndex` of -1).
 *
 * Used for Shift+click and Shift+Arrow range selection.
 */
export function rangeSlice<T>(
  items: ReadonlyArray<T>,
  anchorIndex: number,
  targetIndex: number,
  isEligible?: (item: T) => boolean,
): T[] | null;
