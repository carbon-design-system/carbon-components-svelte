// @ts-check
// Squarified treemap layout (Bruls, Huizing, and van Wijk).

/**
 * Worst aspect ratio in a row of areas laid along a side of length `side`.
 *
 * @param {number} min Smallest area in the row.
 * @param {number} max Largest area in the row.
 * @param {number} sum Total area of the row.
 * @param {number} side
 */
function worst(min, max, sum, side) {
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

/**
 * Tile `values` into the rectangle, each getting an area in proportion to
 * its value and a shape as close to square as the greedy row packing allows.
 * Largest first, from the top left. Output is in input order. Negative and
 * non-finite values get an empty rectangle.
 *
 * @param {ReadonlyArray<number>} values
 * @param {import("./treemap.d.ts").TreemapRect} [box]
 * @returns {import("./treemap.d.ts").TreemapRect[]}
 */
export function squarify(values, box = { x: 0, y: 0, width: 1, height: 1 }) {
  const n = values.length;
  /** @type {import("./treemap.d.ts").TreemapRect[]} */
  const rects = new Array(n);
  /** @type {number[]} */
  const order = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    rects[i] = { x: box.x, y: box.y, width: 0, height: 0 };
    const value = values[i];
    if (Number.isFinite(value) && value > 0) {
      order.push(i);
      total += value;
    }
  }
  if (total <= 0 || !(box.width > 0) || !(box.height > 0)) return rects;
  order.sort((a, b) => values[b] - values[a]);

  // Work in areas, so a row's thickness falls out of its sum.
  const scale = (box.width * box.height) / total;
  let { x, y, width, height } = box;
  let at = 0;
  while (at < order.length) {
    const side = Math.min(width, height);
    let sum = values[order[at]] * scale;
    let min = sum;
    const max = sum;
    let end = at + 1;
    // Grow the row while it keeps its cells closer to square.
    while (end < order.length) {
      const area = values[order[end]] * scale;
      if (
        worst(Math.min(min, area), max, sum + area, side) >
        worst(min, max, sum, side)
      ) {
        break;
      }
      sum += area;
      min = Math.min(min, area);
      end++;
    }

    const thickness = sum / side;
    let offset = 0;
    for (let k = at; k < end; k++) {
      const length = (values[order[k]] * scale) / thickness;
      rects[order[k]] =
        width >= height
          ? { x, y: y + offset, width: thickness, height: length }
          : { x: x + offset, y, width: length, height: thickness };
      offset += length;
    }
    if (width >= height) {
      x += thickness;
      width -= thickness;
    } else {
      y += thickness;
      height -= thickness;
    }
    at = end;
  }
  return rects;
}
