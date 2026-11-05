// @ts-check
// Pure, DOM-free math for the drag and drop engine: the collision strategies
// that turn a pointer into a drop position, the keys that move a lifted item,
// and how fast a scroll box scrolls while a drag presses against its edge.

/**
 * @typedef {import("./dnd-math.js").DndIntent} DndIntent
 * @typedef {import("./dnd-math.js").DndOrientation} DndOrientation
 * @typedef {import("./dnd-math.js").DndEdge} DndEdge
 * @typedef {import("./dnd-math.js").TreePosition} TreePosition
 */

// Collision strategies ------------------------------------------------------

/**
 * Strategy "slot": the gap a pointer is over in a row or column of items.
 * The index of the first item whose midpoint lies beyond the pointer, or
 * `count` when it is past all of them. A slot is a gap between items, so `n`
 * items have `n + 1` of them. Binary search, since a 1,000 item list is read
 * on every pointer move.
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
 * Strategy "nearest": the box whose center is closest to a point, for a grid
 * of items that wraps. `after` says whether the point lies past the center in
 * reading order (below it, or beside it toward the inline end), so a drop
 * lands before or after that box.
 *
 * @param {ReadonlyArray<{ left: number, top: number, right: number, bottom: number }>} boxes
 * @param {number} x
 * @param {number} y
 * @param {boolean} [rtl]
 * @returns {{ index: number, after: boolean } | null} `null` for no boxes.
 */
export function nearestBox(boxes, x, y, rtl = false) {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  let after = false;
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index];
    const cx = (box.left + box.right) / 2;
    const cy = (box.top + box.bottom) / 2;
    const dx = x - cx;
    const dy = y - cy;
    // A pointer inside a box always beats a neighbor's center, so a tall
    // item next to short ones is not skipped.
    const inside =
      x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    const distance = inside
      ? dx * dx * 0.01 + dy * dy * 0.01
      : dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
      const sameRow = Math.abs(dy) <= (box.bottom - box.top) / 2;
      after = sameRow ? (rtl ? dx < 0 : dx > 0) : dy > 0;
    }
  }
  return best === -1 ? null : { index: best, after };
}

/**
 * Strategy "edge": which edge of a box a point is closest to, for drop zones
 * that dock to a side. Sides are physical, so the caller maps `left` and
 * `right` to inline start and end.
 *
 * @param {{ left: number, top: number, right: number, bottom: number }} box
 * @param {number} x
 * @param {number} y
 * @returns {DndEdge}
 */
export function closestEdge(box, x, y) {
  const distances = /** @type {const} */ ([
    ["left", Math.abs(x - box.left)],
    ["right", Math.abs(box.right - x)],
    ["top", Math.abs(y - box.top)],
    ["bottom", Math.abs(box.bottom - y)],
  ]);
  /** @type {readonly [DndEdge, number]} */
  let best = distances[0];
  for (const entry of distances) if (entry[1] < best[1]) best = entry;
  return best[0];
}

/**
 * Strategy "tree": where a drop lands on a row, by thirds of its height. The
 * top third drops before the row, the bottom third after it, the middle
 * inside it. A row that cannot take children has only two halves.
 *
 * @param {number} top - The row's top edge.
 * @param {number} height - The row's height.
 * @param {number} y - The pointer.
 * @param {boolean} [canInside] - Whether the row may take a child.
 * @returns {TreePosition}
 */
export function treePosition(top, height, y, canInside = true) {
  const offset = y - top;
  if (!canInside) return offset < height / 2 ? "before" : "after";
  const third = height / 3;
  if (offset < third) return "before";
  if (offset > third * 2) return "after";
  return "inside";
}

/**
 * Strategy "cell": the cell of a fixed grid a distance from its first cell
 * falls in, rounded to the nearest, so a box is over the cell its corner is
 * closest to.
 *
 * @param {number} offset - Distance in px from the first cell's edge.
 * @param {number} pitch - A cell plus one gap.
 * @param {number} count - Cells along the axis, or `Infinity`.
 * @returns {number}
 */
export function cellAt(offset, pitch, count) {
  return Math.min(Math.max(Math.round(offset / pitch), 0), count - 1);
}

// Scrolling ------------------------------------------------------------------

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

// Keyboard -------------------------------------------------------------------

/**
 * What a key does to a lifted item.
 *
 * `back` and `forward` step along the list; `up` and `down` step a row of a
 * wrapping grid; `prevZone` and `nextZone` hand the item to the neighbor in
 * its group; `start`, `end`, `pageBack` and `pageForward` jump. In RTL the
 * inline arrows swap, so the arrow that points to the inline end always goes
 * forward.
 *
 * @param {string} key
 * @param {DndOrientation} orientation
 * @param {boolean} rtl
 * @returns {DndIntent | null}
 */
export function keyIntent(key, orientation, rtl) {
  if (key === "Home") return "start";
  if (key === "End") return "end";
  if (key === "PageUp") return "pageBack";
  if (key === "PageDown") return "pageForward";
  const inlineBack = rtl ? "ArrowRight" : "ArrowLeft";
  const inlineForward = rtl ? "ArrowLeft" : "ArrowRight";
  if (orientation === "horizontal") {
    if (key === inlineBack) return "back";
    if (key === inlineForward) return "forward";
    if (key === "ArrowUp") return "prevZone";
    if (key === "ArrowDown") return "nextZone";
    return null;
  }
  if (orientation === "grid") {
    if (key === inlineBack) return "back";
    if (key === inlineForward) return "forward";
    if (key === "ArrowUp") return "up";
    if (key === "ArrowDown") return "down";
    return null;
  }
  if (key === "ArrowUp") return "back";
  if (key === "ArrowDown") return "forward";
  if (key === inlineBack) return "prevZone";
  if (key === inlineForward) return "nextZone";
  return null;
}

/** Places a page key moves a lifted item. */
export const PAGE_STEP = 10;

/**
 * The index a linear intent moves to, clamped to `[0, max]`. Returns `index`
 * for an intent that does not move along the list.
 *
 * @param {number} index
 * @param {DndIntent} intent
 * @param {number} max - The last valid index.
 * @returns {number}
 */
export function stepIndex(index, intent, max) {
  let next = index;
  if (intent === "back") next = index - 1;
  else if (intent === "forward") next = index + 1;
  else if (intent === "start") next = 0;
  else if (intent === "end") next = max;
  else if (intent === "pageBack") next = index - PAGE_STEP;
  else if (intent === "pageForward") next = index + PAGE_STEP;
  return Math.min(Math.max(next, 0), Math.max(max, 0));
}
