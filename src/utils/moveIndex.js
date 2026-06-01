// @ts-check
// Cyclic index movement for keyboard navigation. Components like Dropdown,
// ComboBox, MultiSelect, Tabs, OverflowMenu, and ContentSwitcher move a
// highlighted/selected index by a step, wrap at the ends, and (for most) skip
// disabled items. `moveIndex` is the wrap-only primitive; `nextEnabledIndex`
// layers disabled-skipping on top.

/**
 * Move `index` by `step` and wrap once at either end: a result past the end
 * becomes the first item and a result before the start becomes the last item.
 * Returns -1 for an empty range. Designed for single-step moves (`step` ±1), so
 * stepping up from -1 ("nothing selected") lands on the last item and stepping
 * down from -1 lands on the first.
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
 * From `index`, move by `step` cyclically and return the first index whose item
 * is enabled. Returns the original `index` when no enabled item exists (e.g. all
 * items disabled), so callers can leave selection unchanged. `index` may be -1
 * (nothing selected) — `moveIndex(-1, 1, n)` → 0 and `moveIndex(-1, -1, n)` →
 * n-1, landing on the first/last item respectively.
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
