// @ts-check

/**
 * Pick the item to focus when an arrow key opens or enters a menu: the
 * first item for `"ArrowDown"`, the last for `"ArrowUp"`.
 *
 * @template T
 * @param {"ArrowDown" | "ArrowUp"} key
 * @param {ReadonlyArray<T>} items
 * @returns {T | undefined}
 */
export function pickEdgeMenuItem(key, items) {
  return key === "ArrowDown" ? items[0] : items[items.length - 1];
}
