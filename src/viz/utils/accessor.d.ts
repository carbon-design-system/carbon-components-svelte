/**
 * Resolve the `keyof T | (row) => value` accessor props charts accept.
 */

/**
 * A property name or a function. Prefer names, or hoist the function: an
 * inline arrow is a new function on every render, which forces a recompute.
 */
export type Accessor<T, V = unknown> =
  | (keyof T & string)
  | ((row: T, index: number) => V);

/**
 * Turn an accessor prop into a function. The same key always returns the
 * same function, so components can compare accessors by identity and skip
 * recomputing when nothing changed. Functions pass through untouched.
 */
export function toAccessor<T, V = unknown>(
  accessor: Accessor<T, V>,
): (row: T, index: number) => V;

/**
 * Group `rows` by `key` in one pass. Groups keep first-seen order and rows
 * keep input order.
 */
export function groupBy<T, K>(
  rows: ReadonlyArray<T>,
  key: (row: T, index: number) => K,
): Map<K, T[]>;
