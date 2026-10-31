// @ts-check

/**
 * @typedef {Object} FitEntry
 * @property {string} id
 * @property {"item" | "divider"} kind
 * @property {number} width - Size along the main axis, in pixels. Cached from
 *   the last time the entry was shown.
 * @property {number} priority - Higher stays visible longer.
 * @property {boolean} pinned - Never collapses.
 * @property {number} [minWidth] - Set for an entry that shrinks, such as a
 *   field: the least size it takes while any entry shows. The fit counts
 *   this size, so fields shrink to it before anything collapses.
 */

/**
 * The size the shown entries take. A divider counts only between two shown
 * items, and only the first of several in a row.
 *
 * @param {ReadonlyArray<FitEntry>} entries - In DOM order.
 * @param {ReadonlySet<string>} removed
 * @returns {{ width: number; dividers: Set<string> }} `dividers` are the
 *   dividers that stay hidden.
 */
function measureShown(entries, removed) {
  let width = 0;
  let seenItem = false;
  /** @type {FitEntry | null} */
  let pending = null;
  /** @type {Set<string>} */
  const hiddenDividers = new Set();
  for (const entry of entries) {
    if (entry.kind === "divider") {
      if (seenItem && !pending) pending = entry;
      else hiddenDividers.add(entry.id);
    } else if (!removed.has(entry.id)) {
      if (pending) width += pending.width;
      pending = null;
      width += entry.minWidth ?? entry.width;
      seenItem = true;
    }
  }
  if (pending) hiddenDividers.add(pending.id);
  return { width, dividers: hiddenDividers };
}

/**
 * Pick the entries that collapse into the "More" menu. Entries go lowest
 * `priority` first, and among equals the last in DOM order first, until the
 * rest, and the trigger, fit in `available`. Pinned entries never go, and
 * a divider hides when it no longer sits between two shown items.
 *
 * With `previous` and `slack`, a collapsed entry comes back only once it
 * fits with `slack` to spare. The bar then collapses at one width and
 * expands at a larger one, so a width near the boundary does not toggle it
 * on every resize.
 *
 * Pure arithmetic over sizes measured earlier: it reads no layout, so a
 * resize that calls it every frame cannot force one.
 *
 * @param {object} options
 * @param {ReadonlyArray<FitEntry>} options.entries - In DOM order.
 * @param {number} options.available - Room along the main axis.
 * @param {number} options.moreWidth - Size of the "More" trigger.
 * @param {ReadonlySet<string>} [options.previous] - The ids hidden before.
 * @param {number} [options.slack] - Room an entry needs beyond its own
 *   size to come back out of the menu.
 * @returns {Set<string>} The ids that do not show.
 */
export function fitActionBar({
  entries,
  available,
  moreWidth,
  previous,
  slack = 0,
}) {
  const order = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.kind === "item" && !entry.pinned)
    .sort((a, b) => a.entry.priority - b.entry.priority || b.index - a.index)
    .map(({ entry }) => entry.id);

  /** @param {number} count */
  function shownWithout(count) {
    return measureShown(entries, new Set(order.slice(0, count)));
  }

  /**
   * The fewest entries to remove so the rest fit in `room`.
   * @param {number} room
   */
  function countFor(room) {
    if (order.length === 0 || shownWithout(0).width <= room) return 0;
    // The width never grows as more entries are removed, so the first count
    // that fits can be searched for.
    let low = 1;
    let high = order.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (shownWithout(middle).width + moreWidth <= room) high = middle;
      else low = middle + 1;
    }
    return low;
  }

  let count = countFor(available);
  if (previous && slack > 0) {
    const before = order.filter((id) => previous.has(id)).length;
    // Expand only as far as the room, less the slack, allows.
    if (before > count) count = Math.min(before, countFor(available - slack));
  }

  const hidden = new Set(order.slice(0, count));
  for (const id of shownWithout(count).dividers) hidden.add(id);
  return hidden;
}

/**
 * The size the entries that show take, with each field at its `minWidth`.
 * More than the room, once `fitActionBar` has collapsed all it can, means
 * the fields must shrink past their minimum.
 *
 * @param {ReadonlyArray<FitEntry>} entries - In DOM order.
 * @param {ReadonlySet<string>} hidden
 * @returns {number}
 */
export function shownSize(entries, hidden) {
  return measureShown(entries, hidden).width;
}

/**
 * Whether two sets hold the same ids.
 * @param {ReadonlySet<string>} a
 * @param {ReadonlySet<string>} b
 * @returns {boolean}
 */
export function sameIds(a, b) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}
