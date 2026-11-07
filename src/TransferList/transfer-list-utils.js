// @ts-check

/**
 * @typedef {import("./transfer-list-utils.js").TransferListId} Id
 * @typedef {import("./transfer-list-utils.js").TransferListRow} Row
 */

/**
 * Split `items` into the two lists. The selected list follows `selectedIds`
 * in order; the available list follows `items`. An id that names no item is
 * left out of both, and a repeated id counts once.
 *
 * @template {Row} T
 * @param {ReadonlyArray<T>} items
 * @param {ReadonlyArray<Id>} selectedIds
 * @returns {{ available: T[]; selected: T[] }}
 */
export function partitionItems(items, selectedIds) {
  /** @type {Map<Id, T>} */
  const byId = new Map();
  for (const item of items) byId.set(item.id, item);

  /** @type {Set<Id>} */
  const chosen = new Set();
  /** @type {T[]} */
  const selected = [];
  for (const id of selectedIds) {
    const item = byId.get(id);
    if (item === undefined || chosen.has(id)) continue;
    chosen.add(id);
    selected.push(item);
  }

  /** @type {T[]} */
  const available = [];
  for (const item of items) if (!chosen.has(item.id)) available.push(item);
  return { available, selected };
}

/**
 * Whether an item matches the text typed into a list's search field:
 * case-insensitive, anywhere in the item's text.
 *
 * @param {Row} item
 * @param {string} value
 * @returns {boolean}
 */
export function defaultShouldFilterItem(item, value) {
  return item.text.toLowerCase().includes(value.toLowerCase());
}

/**
 * The rows a search leaves. An empty search keeps the array as it is. The
 * default match lower-cases the query once, not once per row.
 *
 * @template {Row} T
 * @param {ReadonlyArray<T>} rows
 * @param {string} value
 * @param {(item: T, value: string) => boolean} [shouldFilter]
 * @returns {ReadonlyArray<T>}
 */
export function filterRows(rows, value, shouldFilter) {
  if (value === "") return rows;
  if (shouldFilter) return rows.filter((row) => shouldFilter(row, value));
  const needle = value.toLowerCase();
  return rows.filter((row) => row.text.toLowerCase().includes(needle));
}

/**
 * Ids to the end of the selected list, in the order given. An id already
 * selected stays where it is.
 *
 * @param {ReadonlyArray<Id>} selectedIds
 * @param {ReadonlyArray<Id>} ids
 * @returns {Id[]}
 */
export function addIds(selectedIds, ids) {
  const present = new Set(selectedIds);
  const next = selectedIds.slice();
  for (const id of ids) {
    if (present.has(id)) continue;
    present.add(id);
    next.push(id);
  }
  return next;
}

/**
 * The selected ids without `ids`, order kept.
 *
 * @param {ReadonlyArray<Id>} selectedIds
 * @param {ReadonlyArray<Id>} ids
 * @returns {Id[]}
 */
export function removeIds(selectedIds, ids) {
  const gone = new Set(ids);
  return selectedIds.filter((id) => !gone.has(id));
}

/**
 * Move the marked ids within the visible ones, as a block, and write the
 * result back into the places the visible ids held. Ids a search hides do
 * not move. A marked id the move cannot take any further stays put, and the
 * rest of the block follows it.
 *
 * @param {ReadonlyArray<Id>} selectedIds Every selected id, in order.
 * @param {ReadonlyArray<Id>} visibleIds The selected ids a search leaves, in order.
 * @param {ReadonlySet<Id>} marked
 * @param {"up" | "down" | "top" | "bottom"} direction
 * @returns {ReadonlyArray<Id>} `selectedIds` itself when nothing moves.
 */
export function reorderIds(selectedIds, visibleIds, marked, direction) {
  let order = visibleIds.slice();
  const length = order.length;

  if (direction === "up") {
    for (let i = 1; i < length; i++) {
      if (marked.has(order[i]) && !marked.has(order[i - 1])) {
        [order[i - 1], order[i]] = [order[i], order[i - 1]];
      }
    }
  } else if (direction === "down") {
    for (let i = length - 2; i >= 0; i--) {
      if (marked.has(order[i]) && !marked.has(order[i + 1])) {
        [order[i + 1], order[i]] = [order[i], order[i + 1]];
      }
    }
  } else {
    const moving = order.filter((id) => marked.has(id));
    const rest = order.filter((id) => !marked.has(id));
    order = direction === "top" ? [...moving, ...rest] : [...rest, ...moving];
  }

  if (order.every((id, i) => id === visibleIds[i])) return selectedIds;

  const visible = new Set(visibleIds);
  const next = selectedIds.slice();
  let k = 0;
  for (let i = 0; i < next.length; i++) {
    if (visible.has(next[i])) next[i] = order[k++];
  }
  return next;
}

/**
 * Put `ids` into the selected list in front of `beforeId`, or after the last
 * visible id when `beforeId` is `null` or cannot be found. An id already
 * selected moves there; one that is not joins the list. Used by a drop.
 *
 * @param {ReadonlyArray<Id>} selectedIds
 * @param {ReadonlyArray<Id>} visibleIds The selected ids a search leaves.
 * @param {ReadonlyArray<Id>} ids
 * @param {Id | null} beforeId
 * @returns {Id[]}
 */
export function insertIds(selectedIds, visibleIds, ids, beforeId) {
  const moving = new Set(ids);
  const rest = selectedIds.filter((id) => !moving.has(id));

  let at = beforeId === null ? -1 : rest.indexOf(beforeId);
  if (at === -1) {
    const visible = new Set(visibleIds);
    let last = -1;
    for (let i = rest.length - 1; i >= 0 && last === -1; i--) {
      if (visible.has(rest[i])) last = i;
    }
    at = last === -1 ? rest.length : last + 1;
  }
  rest.splice(at, 0, ...moving);
  return rest;
}

/**
 * The enabled rows between two indexes, inclusive, in either order.
 *
 * @param {ReadonlyArray<Row>} rows
 * @param {number} from
 * @param {number} to
 * @returns {Id[]}
 */
export function rangeIds(rows, from, to) {
  const start = Math.max(0, Math.min(from, to));
  const end = Math.min(rows.length - 1, Math.max(from, to));
  /** @type {Id[]} */
  const ids = [];
  for (let i = start; i <= end; i++) {
    if (!rows[i].disabled) ids.push(rows[i].id);
  }
  return ids;
}

/**
 * Id of every enabled row.
 *
 * @param {ReadonlyArray<Row>} rows
 * @returns {Id[]}
 */
export function enabledIds(rows) {
  /** @type {Id[]} */
  const ids = [];
  for (const row of rows) if (!row.disabled) ids.push(row.id);
  return ids;
}

/**
 * The index of the first enabled row from `index` in the direction of `step`
 * (1 or -1), or -1 when none is left. No wrapping: a list's ends stop the
 * cursor.
 *
 * @param {ReadonlyArray<Row>} rows
 * @param {number} index
 * @param {1 | -1} step
 * @returns {number}
 */
export function enabledIndexFrom(rows, index, step) {
  for (let i = index; i >= 0 && i < rows.length; i += step) {
    if (!rows[i].disabled) return i;
  }
  return -1;
}

/**
 * The row index a drop at `offsetY` lands in front of: the nearest edge
 * between two rows, counted from the top of the list's content.
 *
 * @param {number} offsetY Distance from the top of the content.
 * @param {number} itemHeight
 * @param {number} count Rows in the list.
 * @returns {number} 0 to `count`, where `count` is after the last row.
 */
export function dropIndex(offsetY, itemHeight, count) {
  const edge = Math.round(offsetY / itemHeight);
  return Math.max(0, Math.min(count, edge));
}
