// @ts-check

import { debounce } from "./debounce.js";

/** Quiet period (ms) after which the typed query resets. */
const TYPEAHEAD_DELAY = 500;

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
  const disabled =
    isDisabled ??
    ((/** @type {T} */ item) =>
      Boolean(/** @type {{ disabled?: boolean }} */ (item)?.disabled));
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

/**
 * Whether `event` is an unmodified printable key that should feed typeahead.
 * Space is excluded so it keeps activating the focused item.
 *
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isTypeaheadKey(event) {
  return (
    event.key.length === 1 &&
    event.key !== " " &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

/**
 * Accumulate typed characters into a lowercase query that resets after
 * `delay` ms without typing. Call `clear()` when the list closes or unmounts.
 *
 * @param {number} [delay]
 * @returns {{ push: (character: string) => string; clear: () => void }}
 */
export function createTypeaheadBuffer(delay = TYPEAHEAD_DELAY) {
  let query = "";
  const reset = debounce(() => {
    query = "";
  }, delay);

  return {
    push(character) {
      query += character.toLowerCase();
      reset();
      return query;
    },
    clear() {
      query = "";
      reset.cancel();
    },
  };
}
