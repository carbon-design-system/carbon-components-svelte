// @ts-check
// Pure, DOM-free math for `sortable`: where a drop lands, how the list
// scrolls near an edge, and how a `sort` event applies to an array.

/**
 * @typedef {import("./sortable-model.js").SortDetail} SortDetail
 */

/**
 * The slot a pointer would drop into: the index of the first item whose
 * midpoint lies beyond the pointer, or `count` when it is past all of them.
 * A slot is a gap between items, so `n` items have `n + 1` of them.
 * Binary search, since a 1,000 item list is read on every pointer move.
 *
 * @param {number} count - Number of items.
 * @param {(index: number) => number} midpoint - An item's midpoint along the
 *   list's axis. RTL lists pass negated positions.
 * @param {number} pointer - The pointer's position along the same axis.
 * @returns {number}
 */
export function insertionSlot(count, midpoint, pointer) {
  let low = 0;
  let high = count;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (pointer < midpoint(mid)) high = mid;
    else low = mid + 1;
  }
  return low;
}

/**
 * The final index of the dragged item for a drop into `slot`. Taking the item
 * out of its own list first shifts every later slot of that list down by one.
 *
 * @param {number} slot - A slot of the destination list, counted with the
 *   dragged item still in place.
 * @param {number} oldIndex - The dragged item's index in its source list.
 * @param {boolean} sameList - Whether the destination is the source list.
 * @returns {number}
 */
export function slotToIndex(slot, oldIndex, sameList) {
  return sameList && slot > oldIndex ? slot - 1 : slot;
}

/**
 * The slot that puts the dragged item at final index `index`. The inverse of
 * `slotToIndex`.
 *
 * @param {number} index
 * @param {number} oldIndex
 * @param {boolean} sameList
 * @returns {number}
 */
export function indexToSlot(index, oldIndex, sameList) {
  return sameList && index > oldIndex ? index + 1 : index;
}

/**
 * Scroll speed (px/s, signed) for a pointer near the edges of a scroll area.
 * Zero outside the edge zones, rising linearly toward the edge. `held` ramps
 * the speed up while the pointer stays in a zone, so brushing an edge on the
 * way to a drop does not fling the list.
 *
 * @param {object} options
 * @param {number} options.pointer - Pointer position along the axis.
 * @param {number} options.start - Start edge of the scroll area.
 * @param {number} options.end - End edge of the scroll area.
 * @param {number} [options.zone] - Edge zone size in px. Default 48, capped
 *   at a third of the area so the middle never scrolls.
 * @param {number} [options.maxSpeed] - Top speed in px/s. Default 900.
 * @param {number} [options.held] - ms the pointer has been in a zone.
 * @param {number} [options.ramp] - ms to reach full speed. Default 400.
 * @returns {number}
 */
export function edgeScrollSpeed({
  pointer,
  start,
  end,
  zone = 48,
  maxSpeed = 900,
  held = Number.POSITIVE_INFINITY,
  ramp = 400,
}) {
  const edge = Math.min(zone, Math.max(end - start, 0) / 3);
  if (edge <= 0) return 0;
  const warm = 0.15 + 0.85 * Math.min(held / ramp, 1);
  if (pointer < start + edge) {
    const depth = Math.min((start + edge - pointer) / edge, 1.5);
    return -maxSpeed * depth * warm;
  }
  if (pointer > end - edge) {
    const depth = Math.min((pointer - (end - edge)) / edge, 1.5);
    return maxSpeed * depth * warm;
  }
  return 0;
}

/**
 * What an arrow key does to a lifted item.
 * `"back"` and `"forward"` move along the list; `"prevList"` and
 * `"nextList"` hand the item to the neighbor in its group. In RTL the inline
 * arrows swap, so the arrow that points to the inline end always goes
 * forward.
 *
 * @param {string} key
 * @param {"vertical" | "horizontal"} orientation
 * @param {boolean} rtl
 * @returns {"back" | "forward" | "prevList" | "nextList" | null}
 */
export function liftedKeyAction(key, orientation, rtl) {
  const inlineBack = rtl ? "ArrowRight" : "ArrowLeft";
  const inlineForward = rtl ? "ArrowLeft" : "ArrowRight";
  if (orientation === "horizontal") {
    if (key === inlineBack) return "back";
    if (key === inlineForward) return "forward";
    if (key === "ArrowUp") return "prevList";
    if (key === "ArrowDown") return "nextList";
    return null;
  }
  if (key === "ArrowUp") return "back";
  if (key === "ArrowDown") return "forward";
  if (key === inlineBack) return "prevList";
  if (key === inlineForward) return "nextList";
  return null;
}

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
