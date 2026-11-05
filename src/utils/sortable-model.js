// @ts-check
// Pure helpers that apply a `sort` event to your data.

/**
 * @typedef {import("./sortable-model.js").SortDetail} SortDetail
 */

/**
 * A copy of `items` with the item at `from` moved to `to`.
 * Out-of-range indexes clamp.
 *
 * @template T
 * @param {ReadonlyArray<T>} items
 * @param {number} from
 * @param {number} to - The item's final index.
 * @returns {T[]}
 */
export function moveItem(items, from, to) {
  const next = items.slice();
  if (from < 0 || from >= next.length) return next;
  const target = Math.min(Math.max(to, 0), next.length - 1);
  if (target === from) return next;
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

/**
 * Apply a `sort` event to your data without mutating it.
 *
 * Pass one array to reorder a single list. Pass a record of arrays, keyed by
 * the lists' `name`, to reorder within a list or to move an item between
 * connected lists. Unknown names and stale indexes leave the data as it was.
 *
 * @template T
 * @param {ReadonlyArray<T> | Record<string, ReadonlyArray<T>>} data
 * @param {SortDetail} detail
 * @returns {T[] | Record<string, T[]>}
 */
export function applySort(data, detail) {
  const { from, to, oldIndex, newIndex } = detail;
  if (Array.isArray(data)) return moveItem(data, oldIndex, newIndex);

  const lists = /** @type {Record<string, ReadonlyArray<T>>} */ (data);
  const next = /** @type {Record<string, T[]>} */ ({});
  for (const name of Object.keys(lists)) next[name] = lists[name].slice();
  const source = next[from];
  if (!source || oldIndex < 0 || oldIndex >= source.length) return next;
  if (from === to) {
    next[from] = moveItem(source, oldIndex, newIndex);
    return next;
  }
  if (!next[to]) return next;
  const [item] = source.splice(oldIndex, 1);
  next[to].splice(Math.min(Math.max(newIndex, 0), next[to].length), 0, item);
  return next;
}
