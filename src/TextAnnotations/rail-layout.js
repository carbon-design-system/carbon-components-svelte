/**
 * Place the cards of the margin rail: each at the top of its range, pushed
 * down to clear the card above it. The cards keep the order given, which is
 * the order of the text and of the list in the DOM, so what a keyboard moves
 * through is what the eye reads. Pure geometry, so it is unit tested
 * without a browser.
 */

/**
 * @typedef {object} RailItem
 * @property {string} id
 * @property {number} top Where the card would sit beside its range.
 * @property {number} height
 */

/**
 * @param {ReadonlyArray<RailItem>} items
 * @param {number} [gap] The room kept between cards.
 * @returns {{ tops: Record<string, number>, height: number }} The top of each card by id, and the height of the rail.
 */
export function layoutRail(items, gap = 8) {
  /** @type {Record<string, number>} */
  const tops = {};
  let bottom = 0;
  let floor = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    const top = Math.max(item.top, floor);
    tops[item.id] = top;
    bottom = Math.max(bottom, top + item.height);
    floor = top + item.height + gap;
  }
  return { tops, height: bottom };
}
