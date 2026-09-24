// @ts-check

/**
 * Toggle membership of `item` in `array`, returning a new array.
 *
 * @template T
 * @param {ReadonlyArray<T>} array
 * @param {T} item
 * @returns {ReadonlyArray<T>}
 */
export function toggleArrayItem(array, item) {
  return array.includes(item)
    ? array.filter((_) => _ !== item)
    : [...array, item];
}

/**
 * Add `item` to `array` if not already present, returning a new array
 * (or the same array reference when no change is needed).
 *
 * @template T
 * @param {ReadonlyArray<T>} array
 * @param {T} item
 * @returns {ReadonlyArray<T>}
 */
export function addUniqueArrayItem(array, item) {
  return array.includes(item) ? array : [...array, item];
}
