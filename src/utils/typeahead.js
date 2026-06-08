// @ts-check

/**
 * Next enabled item whose text starts with `query`, searching forward from
 * `index` and wrapping once. Returns `index` if nothing matches.
 *
 * @template T
 * @param {object} options
 * @param {ReadonlyArray<T>} options.items
 * @param {string} options.query
 * @param {(item: T) => string} options.itemToString
 * @param {number} options.index - May be -1 when nothing is highlighted.
 * @param {(item: T) => boolean} [options.isDisabled] - Defaults to `item.disabled`.
 * @returns {number}
 */
export function typeaheadIndex({
  items,
  query,
  itemToString,
  index,
  isDisabled,
}) {
  if (items.length === 0 || query === "") return index;
  const disabled = isDisabled ?? ((item) => Boolean(item?.disabled));
  const needle = query.toLowerCase();
  const start = index >= 0 ? index + 1 : 0;
  for (let offset = 0; offset < items.length; offset++) {
    const i = (start + offset) % items.length;
    if (
      !disabled(items[i]) &&
      itemToString(items[i]).toLowerCase().startsWith(needle)
    ) {
      return i;
    }
  }
  return index;
}
