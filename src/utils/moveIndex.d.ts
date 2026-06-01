/**
 * Cyclic index movement for keyboard navigation. `moveIndex` is the wrap-only
 * primitive; `nextEnabledIndex` layers disabled-skipping on top.
 */

/**
 * Move `index` by `step` and wrap once at either end: a result past the end
 * becomes the first item and a result before the start becomes the last item.
 * Returns -1 for an empty range. Designed for single-step moves (`step` ±1).
 */
export function moveIndex(index: number, step: number, length: number): number;

/**
 * From `index`, move by `step` cyclically and return the first index whose item
 * is enabled. Returns the original `index` when no enabled item exists, so
 * callers can leave selection unchanged.
 */
export function nextEnabledIndex<T>(options: {
  items: ReadonlyArray<T>;
  index: number;
  step: number;
  /** Defaults to `item.disabled`. */
  isDisabled?: (item: T) => boolean;
}): number;
