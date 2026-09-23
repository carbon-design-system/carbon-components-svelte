// @ts-check

import { clampIndex } from "./clamp-index.js";

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
 * Move from `index` by `step` to the next enabled item, skipping disabled
 * ones. Returns `index` when no enabled item exists in that direction.
 * `index` may be -1.
 *
 * @template T
 * @param {object} options
 * @param {ReadonlyArray<T>} options.items
 * @param {number} options.index - Current index (may be -1).
 * @param {number} options.step - Direction/magnitude to move (e.g. 1 or -1).
 * @param {(item: T) => boolean} [options.isDisabled] - Defaults to `item.disabled`.
 * @param {boolean} [options.wrap] - Wrap at the ends. Default `true`; `false` clamps.
 * @returns {number}
 */
export function nextEnabledIndex({
  items,
  index,
  step,
  isDisabled,
  wrap = true,
}) {
  const length = items.length;
  if (length === 0) return index;
  const disabled = isDisabled ?? ((item) => Boolean(item?.disabled));
  const advance = wrap
    ? (i) => moveIndex(i, step, length)
    : (i) => clampIndex(i, step, length);

  let candidate = advance(index);
  let attempts = 0;
  while (disabled(items[candidate]) && attempts < length) {
    const next = advance(candidate);
    if (!wrap && next === candidate) break;
    candidate = next;
    attempts++;
  }
  return disabled(items[candidate]) ? index : candidate;
}
