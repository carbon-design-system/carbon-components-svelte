// @ts-check

/**
 * Move `index` by `step` and wrap once at either end. Returns -1 for an empty
 * range. For single-step moves (`step` ±1), stepping from -1 lands on the
 * last item (step +1) or first item (step -1).
 *
 * @param {number} index - Current index (may be -1 when nothing is selected).
 * @param {number} step - Amount/direction to move (e.g. 1 or -1).
 * @param {number} length - Number of items.
 * @returns {number}
 */
export function moveIndex(index, step, length) {
  if (length <= 0) return -1;
  const next = index + step;
  if (next < 0) return length - 1;
  if (next >= length) return 0;
  return next;
}

/**
 * Cyclically move from `index` by `step` to the first enabled item. Returns
 * `index` when no enabled item exists. `index` may be -1.
 *
 * @template T
 * @param {object} options
 * @param {ReadonlyArray<T>} options.items
 * @param {number} options.index - Current index (may be -1).
 * @param {number} options.step - Direction/magnitude to move (e.g. 1 or -1).
 * @param {(item: T) => boolean} [options.isDisabled] - Defaults to `item.disabled`.
 * @returns {number}
 */
export function nextEnabledIndex({ items, index, step, isDisabled }) {
  const length = items.length;
  if (length === 0) return index;
  const disabled = isDisabled ?? ((item) => Boolean(item?.disabled));
  let candidate = moveIndex(index, step, length);
  let attempts = 0;
  while (disabled(items[candidate]) && attempts < length) {
    candidate = moveIndex(candidate, step, length);
    attempts++;
  }
  return disabled(items[candidate]) ? index : candidate;
}
