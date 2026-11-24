// @ts-check

/**
 * @typedef {{ top: number; bottom: number; left: number; right: number }} RowRect
 */

/**
 * `true` when `rect`'s vertical center falls inside `row`.
 * @param {RowRect} rect
 * @param {RowRect} row
 */
function inRow(rect, row) {
  const middle = (rect.top + rect.bottom) / 2;
  return middle >= row.top && middle <= row.bottom;
}

/**
 * Index of the item in the visual row below (`step` 1) or above (`step` -1)
 * the item at `index`, whose horizontal center is nearest to that item's.
 * Rows come from layout, so this works for a wrapping grid at any width and
 * across headings between groups. Items are in reading order, so each row
 * is a run of indexes; only the current row and the next one are measured.
 *
 * Returns `index` when there is no row in that direction.
 *
 * @param {number} count - Number of items.
 * @param {number} index - Item to move from.
 * @param {1 | -1} step - 1 for the row below, -1 for the row above.
 * @param {(index: number) => RowRect} getRect - Reads an item's box.
 * @param {(index: number) => boolean} [skip] - Items focus can't land on.
 * @returns {number}
 */
export function adjacentRowIndex(count, index, step, getRect, skip) {
  if (index < 0 || index >= count) return index;
  const from = getRect(index);
  const center = (from.left + from.right) / 2;

  let i = index + step;
  while (i >= 0 && i < count && inRow(getRect(i), from)) i += step;
  if (i < 0 || i >= count) return index;

  const row = getRect(i);
  let best = index;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (; i >= 0 && i < count; i += step) {
    const rect = getRect(i);
    if (!inRow(rect, row)) break;
    if (skip?.(i)) continue;
    const distance = Math.abs((rect.left + rect.right) / 2 - center);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}
