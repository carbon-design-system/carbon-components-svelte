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

/**
 * Whether `a` and `b` hold the same items in the same order, compared with
 * `===`. Unlike `a === b`, an array compared with a copy of its earlier
 * contents reads as changed after an in-place mutation.
 *
 * @param {ReadonlyArray<unknown>} a
 * @param {ReadonlyArray<unknown>} b
 * @returns {boolean}
 */
export function sameArrayItems(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Whether `items` holds exactly the members of `set`, ignoring order and
 * duplicates. Sizes are compared as sets, not by `items.length`: a
 * duplicate (`["1", "1"]` against `{"1", "2"}`) matches on length and
 * membership while holding something different.
 *
 * @param {ReadonlyArray<unknown>} items
 * @param {ReadonlySet<unknown>} set
 * @returns {boolean}
 */
export function sameItemSet(items, set) {
  if (items.length < set.size) return false;
  if (!items.every((item) => set.has(item))) return false;
  return new Set(items).size === set.size;
}
