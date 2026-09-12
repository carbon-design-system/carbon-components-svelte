// @ts-check

/**
 * Build a record keyed by `getKey(item)`, defaulting to `item.id`.
 * Later items win over earlier items with duplicate keys.
 *
 * @template T
 * @param {ReadonlyArray<T>} items
 * @param {(item: T) => string | number} [getKey]
 * @returns {Record<string, T>}
 */
export function keyBy(items, getKey) {
  const key = getKey ?? ((item) => /** @type {any} */ (item).id);
  /** @type {Record<string, T>} */
  const result = {};
  for (const item of items) {
    result[key(item)] = item;
  }
  return result;
}

export default keyBy;
