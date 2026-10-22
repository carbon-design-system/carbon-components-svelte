// @ts-check
// Resolve the `keyof T | (row) => value` accessor props charts accept.

/** @type {Map<string, (row: any) => any>} */
const keyAccessors = new Map();

/**
 * Turn an accessor prop into a function. The same key always returns the
 * same function, so components can compare accessors by identity and skip
 * recomputing when nothing changed. Functions pass through untouched.
 *
 * @template T
 * @template V
 * @param {import("./accessor.d.ts").Accessor<T, V>} accessor
 * @returns {(row: T, index: number) => V}
 */
export function toAccessor(accessor) {
  if (typeof accessor === "function") return accessor;
  let fn = keyAccessors.get(accessor);
  if (!fn) {
    fn = (row) => row?.[accessor];
    keyAccessors.set(accessor, fn);
  }
  return fn;
}

/**
 * Group `rows` by `key` in one pass. Groups keep first-seen order and rows
 * keep input order.
 *
 * @template T
 * @template K
 * @param {ReadonlyArray<T>} rows
 * @param {(row: T, index: number) => K} key
 * @returns {Map<K, T[]>}
 */
export function groupBy(rows, key) {
  /** @type {Map<K, T[]>} */
  const groups = new Map();
  for (let i = 0; i < rows.length; i++) {
    const k = key(rows[i], i);
    const group = groups.get(k);
    if (group) group.push(rows[i]);
    else groups.set(k, [rows[i]]);
  }
  return groups;
}
