/**
 * Build a record keyed by `getKey(item)`, defaulting to `item.id`.
 * Later items win over earlier items with duplicate keys.
 */
export function keyBy<T>(
  items: ReadonlyArray<T>,
  getKey?: (item: T) => string | number,
): Record<string, T>;
