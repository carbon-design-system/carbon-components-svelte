// @ts-check
// Density contours: a smoothed count of points on a grid, then the
// isolines at chosen levels by marching squares.

/**
 * Smoothed density of `points` on a grid of square cells over a box. A
 * Gaussian of the given bandwidth (in the same units as the points) is
 * dropped on every point, so the result is comparable across charts of
 * the same size. Values are per-cell weights, not normalized.
 *
 * @param {ReadonlyArray<{ x: number; y: number } | null | undefined>} points
 * @param {import("./contour.d.ts").DensityGridOptions} options
 * @returns {import("./contour.d.ts").DensityGrid}
 */
export function densityGrid(points, options) {
  const { width, height, cellSize = 4, bandwidth = 20 } = options;
  const columns = Math.max(2, Math.ceil(width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(height / cellSize) + 1);
  const values = new Float64Array(columns * rows);
  const reach = Math.ceil((bandwidth * 3) / cellSize);
  const twoSigma2 = 2 * bandwidth * bandwidth;
  let peak = 0;
  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    const ci = point.x / cellSize;
    const ri = point.y / cellSize;
    const c0 = Math.max(0, Math.floor(ci) - reach);
    const c1 = Math.min(columns - 1, Math.ceil(ci) + reach);
    const r0 = Math.max(0, Math.floor(ri) - reach);
    const r1 = Math.min(rows - 1, Math.ceil(ri) + reach);
    for (let row = r0; row <= r1; row++) {
      const dy = (row - ri) * cellSize;
      for (let col = c0; col <= c1; col++) {
        const dx = (col - ci) * cellSize;
        const weight = Math.exp(-(dx * dx + dy * dy) / twoSigma2);
        const at = row * columns + col;
        values[at] += weight;
        if (values[at] > peak) peak = values[at];
      }
    }
  }
  return { values, columns, rows, cellSize, peak };
}

// Which cell edges each marching-squares case crosses: pairs of edges,
// 0 top, 1 right, 2 bottom, 3 left, with the corner bits ordered
// top-left, top-right, bottom-right, bottom-left.
/** @type {ReadonlyArray<ReadonlyArray<[number, number]>>} */
const CASES = [
  [],
  [[3, 2]],
  [[2, 1]],
  [[3, 1]],
  [[0, 1]],
  [
    [3, 0],
    [2, 1],
  ],
  [[0, 2]],
  [[3, 0]],
  [[3, 0]],
  [[0, 2]],
  [
    [3, 2],
    [0, 1],
  ],
  [[0, 1]],
  [[3, 1]],
  [[2, 1]],
  [[3, 2]],
  [],
];

/**
 * The isolines of a density grid at each level, as one SVG path per level
 * in the grid's pixel space. Edge crossings are placed by linear
 * interpolation, so the lines are smooth at the grid's resolution.
 *
 * @param {import("./contour.d.ts").DensityGrid} grid
 * @param {ReadonlyArray<number>} levels
 * @returns {import("./contour.d.ts").ContourLevel[]}
 */
export function contours(grid, levels) {
  const { values, columns, rows, cellSize } = grid;
  const at = (/** @type {number} */ col, /** @type {number} */ row) =>
    values[row * columns + col];
  const r = (/** @type {number} */ v) => Math.round(v * 100) / 100;
  return levels.map((level) => {
    /** @type {string[]} */
    const parts = [];
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < columns - 1; col++) {
        const tl = at(col, row);
        const tr = at(col + 1, row);
        const br = at(col + 1, row + 1);
        const bl = at(col, row + 1);
        const index =
          (tl >= level ? 8 : 0) |
          (tr >= level ? 4 : 0) |
          (br >= level ? 2 : 0) |
          (bl >= level ? 1 : 0);
        if (index === 0 || index === 15) continue;
        // Where the level crosses each edge, between its two corners.
        const cross = (/** @type {number} */ a, /** @type {number} */ b) =>
          b === a ? 0.5 : (level - a) / (b - a);
        const x0 = col * cellSize;
        const y0 = row * cellSize;
        const edge = (/** @type {number} */ side) => {
          switch (side) {
            case 0:
              return [x0 + cross(tl, tr) * cellSize, y0];
            case 1:
              return [x0 + cellSize, y0 + cross(tr, br) * cellSize];
            case 2:
              return [x0 + cross(bl, br) * cellSize, y0 + cellSize];
            default:
              return [x0, y0 + cross(tl, bl) * cellSize];
          }
        };
        for (const [from, to] of CASES[index]) {
          const [x1, y1] = edge(from);
          const [x2, y2] = edge(to);
          parts.push(`M${r(x1)},${r(y1)}L${r(x2)},${r(y2)}`);
        }
      }
    }
    return { level, d: parts.join("") };
  });
}

/**
 * Evenly spaced levels between a share of the peak and the peak, so the
 * outermost line encloses most of the mass and the innermost the mode.
 *
 * @param {number} peak
 * @param {number} count
 * @param {number} [floor] Share of the peak for the lowest level.
 * @returns {number[]}
 */
export function levelsFor(peak, count, floor = 0.1) {
  if (!(peak > 0) || count < 1) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(peak * (floor + ((1 - floor) * i) / count));
  }
  return out;
}
