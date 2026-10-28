// @ts-check
// Pure board math for `Kanban`: grouping, applying a move, stepping a
// keyboard drag, and the edge-scroll speed. No DOM and no Svelte, so each
// rule is covered once here instead of through component renders.

/**
 * @typedef {object} KanbanColumnLike
 * @property {string} id
 * @property {number} [limit]
 * @property {boolean} [collapsible]
 */

/**
 * @typedef {object} KanbanItemLike
 * @property {string} id
 * @property {string} column
 */

/**
 * @typedef {object} KanbanTarget
 * @property {string} column - Id of the column the card would land in.
 * @property {number} index - Position in that column once the card is
 *   removed from where it was and inserted, so `0` is the top and the
 *   column's size without the card is the bottom.
 */

/**
 * Group card ids by column, keeping the order of `items`. A card whose
 * `column` matches no column is left out.
 * @template {KanbanItemLike} Item
 * @param {ReadonlyArray<{ id: string }>} columns
 * @param {ReadonlyArray<Item>} items
 * @returns {{ ids: Map<string, string[]>, byId: Map<string, Item> }}
 */
export function groupByColumn(columns, items) {
  /** @type {Map<string, string[]>} */
  const ids = new Map();
  for (const column of columns) ids.set(column.id, []);
  /** @type {Map<string, Item>} */
  const byId = new Map();
  for (const item of items) {
    const list = ids.get(item.column);
    if (!list) continue;
    list.push(item.id);
    byId.set(item.id, item);
  }
  return { ids, byId };
}

/**
 * Where a move leaves a card, as the position among the other cards of the
 * target column. `p` counts children of the column including the card
 * itself when it is in that column at child `dragged`.
 * @param {number} p - Slot to insert before, `0` to the child count.
 * @param {number} dragged - Child index of the card in the target column, or `-1`.
 * @returns {number}
 */
export function finalIndex(p, dragged) {
  return dragged >= 0 && p > dragged ? p - 1 : p;
}

/**
 * The slot among a column's children that a final index inserts before.
 * The inverse of `finalIndex`.
 * @param {number} index
 * @param {number} dragged - Child index of the card in the column, or `-1`.
 * @returns {number}
 */
export function slotFor(index, dragged) {
  return dragged >= 0 && index >= dragged ? index + 1 : index;
}

/**
 * First slot whose midpoint lies past `point`. Midpoints must ascend, which
 * holds for a column's cards in DOM order. Reads `O(log n)` of them.
 * @param {number} count
 * @param {(slot: number) => number} midpoint
 * @param {number} point
 * @returns {number} `0` to `count`
 */
export function slotAt(count, midpoint, point) {
  let low = 0;
  let high = count;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (point < midpoint(middle)) high = middle;
    else low = middle + 1;
  }
  return low;
}

/**
 * Apply a move to `items` without changing the array or its cards. Returns
 * the same array when the card lands where it was.
 * @template {KanbanItemLike} Item
 * @param {ReadonlyArray<Item>} items
 * @param {{ id: string, to: string, index: number }} move
 * @returns {ReadonlyArray<Item>}
 */
export function applyMove(items, { id, to, index }) {
  const from = items.findIndex((item) => item.id === id);
  if (from === -1) return items;
  const card = items[from];
  const rest = items.filter((_, position) => position !== from);
  // Positions in `rest` of the target column's cards.
  const target = [];
  for (let position = 0; position < rest.length; position++) {
    if (rest[position].column === to) target.push(position);
  }
  const at = Math.max(0, Math.min(index, target.length));
  const sameColumn = card.column === to;
  // Where the card stands among its column's cards. Landing there again
  // changes nothing, even if the flat array would reorder around other
  // columns' cards.
  if (sameColumn && target.filter((position) => position < from).length === at)
    return items;
  let insertAt = rest.length;
  if (at < target.length) insertAt = target[at];
  else if (target.length > 0) insertAt = target[target.length - 1] + 1;
  const next = rest.slice();
  next.splice(insertAt, 0, sameColumn ? card : { ...card, column: to });
  return next;
}

/**
 * Whether a card may enter `column` under a hard work-in-progress limit.
 * Reordering inside a column is always allowed, so a column that is over
 * its limit can still be sorted and emptied.
 * @param {{ limit?: number } | undefined} column
 * @param {number} count - Cards in the column now.
 * @param {boolean} sameColumn
 * @returns {boolean}
 */
export function hasRoom(column, count, sameColumn) {
  if (sameColumn || !column || typeof column.limit !== "number") return true;
  return count < column.limit;
}

/**
 * @typedef {"up" | "down" | "start" | "end" | "previous" | "next"} StepKey
 */

/**
 * Step a keyboard drag. Returns `null` when there is nowhere to go.
 * `previous` and `next` change column and keep the index, clamped to the
 * new column. Columns `skip` says to pass over (collapsed ones) are never
 * stopped on; a column that is full under a hard limit stops the step in
 * `blocked` instead, so the caller can say why.
 * @param {object} options
 * @param {ReadonlyArray<string>} options.order - Column ids in reading order.
 * @param {(column: string) => number} options.size - Cards a column holds
 *   once the dragged card is out of it.
 * @param {KanbanTarget} options.from - Current target.
 * @param {StepKey} options.key
 * @param {(column: string) => boolean} [options.skip]
 * @param {(column: string) => boolean} [options.full] - Whether a hard
 *   limit keeps the card out of the column.
 * @returns {{ target: KanbanTarget | null, blocked?: string }}
 */
export function stepTarget({ order, size, from, key, skip, full }) {
  const here = from.column;
  const count = size(here);
  if (key === "up" || key === "down" || key === "start" || key === "end") {
    const index =
      key === "up"
        ? from.index - 1
        : key === "down"
          ? from.index + 1
          : key === "start"
            ? 0
            : count;
    const clamped = Math.max(0, Math.min(index, count));
    return {
      target: clamped === from.index ? null : { column: here, index: clamped },
    };
  }
  const step = key === "previous" ? -1 : 1;
  let position = order.indexOf(here) + step;
  while (position >= 0 && position < order.length) {
    const column = order[position];
    if (skip?.(column)) {
      position += step;
      continue;
    }
    if (full?.(column)) return { target: null, blocked: column };
    return {
      target: { column, index: Math.min(from.index, size(column)) },
    };
  }
  return { target: null };
}

/**
 * Edge-scroll speed in px/s for a pointer near the edges of a scroll box.
 * Zero outside the zone, rising with the square of how far into it the
 * pointer is. Negative scrolls toward the start.
 * @param {object} options
 * @param {number} options.point - Pointer position on the axis.
 * @param {number} options.start - Box edge at the start of the axis.
 * @param {number} options.end - Box edge at the end of the axis.
 * @param {number} options.zone - Width of the sensitive band at each edge.
 * @param {number} options.max - Speed at the very edge, in px/s.
 * @returns {number}
 */
export function edgeSpeed({ point, start, end, zone, max }) {
  const band = Math.min(zone, (end - start) / 2);
  if (band <= 0) return 0;
  let depth = 0;
  let direction = 0;
  if (point < start + band) {
    depth = (start + band - point) / band;
    direction = -1;
  } else if (point > end - band) {
    depth = (point - (end - band)) / band;
    direction = 1;
  }
  const eased = Math.min(depth, 1) ** 2;
  return direction * eased * max;
}
