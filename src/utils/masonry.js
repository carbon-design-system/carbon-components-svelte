// @ts-check

/**
 * Browsers lay out in 1/64 px steps. Snapping heights to the same step keeps
 * every column's running total exact in floating point, so two columns of
 * equal items tie, and the item goes to the inline-start one as it does under
 * `display: grid-lanes`.
 *
 * @param {number} px
 */
export function snap(px) {
  return Math.round(px * 64) / 64;
}

const WHITESPACE = /\s+/;

/**
 * Count the tracks in a resolved `grid-template-columns`, such as
 * `"180px 180px [a] 180px"`. Line names are not tracks. One track when the
 * grid has no template (`"none"`) or the value is empty.
 *
 * @param {string} template
 */
export function countTracks(template) {
  const tracks = template
    .split(WHITESPACE)
    .filter((part) => part && part !== "none" && !part.startsWith("["));
  return Math.max(1, tracks.length);
}

/**
 * Put each item, in order, in the shortest column, the one nearest the inline
 * start on a tie. An item's top is the shortest column's height when it is
 * placed, and that never decreases, so the tops follow the order of the items:
 * source order is reading order, for every set of heights.
 *
 * @param {ArrayLike<number>} heights Border-box height of each item, in order.
 * @param {number} columns Number of columns.
 * @param {number} gap Space between items in a column.
 * @returns {{ column: number[]; top: number[]; height: number }}
 *   `column` is zero-based, from the inline start. `height` is the tallest
 *   column, without the gap after its last item.
 */
export function placeMasonry(heights, columns, gap) {
  const count = Math.max(1, Math.floor(columns) || 1);
  const space = snap(gap);
  const ends = new Array(count).fill(0);
  const column = new Array(heights.length);
  const top = new Array(heights.length);
  for (let i = 0; i < heights.length; i++) {
    let shortest = 0;
    for (let c = 1; c < count; c++) if (ends[c] < ends[shortest]) shortest = c;
    column[i] = shortest;
    top[i] = ends[shortest];
    ends[shortest] += snap(heights[i]) + space;
  }
  let tallest = 0;
  for (let c = 0; c < count; c++) if (ends[c] > tallest) tallest = ends[c];
  return { column, top, height: heights.length ? tallest - space : 0 };
}
