/** Toggle membership of `item` in `array`, returning a new array. */
export function toggleArrayItem<T>(
  array: ReadonlyArray<T>,
  item: T,
): ReadonlyArray<T>;

/**
 * Add `item` to `array` if not already present, returning a new array
 * (or the same array reference when no change is needed).
 */
export function addUniqueArrayItem<T>(
  array: ReadonlyArray<T>,
  item: T,
): ReadonlyArray<T>;
