/**
 * Cyclic index movement for keyboard navigation. `moveIndex` wraps at list
 * ends; `nextEnabledIndex` skips disabled items.
 */

/** Move `index` by `step` and wrap once at either end. */
export function moveIndex(index: number, step: number, length: number): number;

/** Cyclically move to the first enabled item, or return `index` if none. */
export function nextEnabledIndex<T>(options: {
  items: ReadonlyArray<T>;
  index: number;
  step: number;
  /** @default item => item.disabled */
  isDisabled?: (item: T) => boolean;
}): number;
