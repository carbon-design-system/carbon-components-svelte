// @ts-check
// Hexagonal binning of points in pixel space, for density on a scatter.

const THIRD = Math.PI / 3;
const ANGLES = [0, THIRD, 2 * THIRD, 3 * THIRD, 4 * THIRD, 5 * THIRD];

/**
 * SVG path of a pointy-top hexagon of the given radius, centered on the
 * origin, for `transform="translate(cx cy)"`.
 *
 * @param {number} radius
 * @returns {string}
 */
export function hexagonPath(radius) {
  const r = Math.round(radius * 100) / 100;
  return `M${ANGLES.map((angle) => {
    const x = Math.round(r * Math.sin(angle) * 100) / 100;
    const y = Math.round(-r * Math.cos(angle) * 100) / 100;
    return `${x},${y}`;
  }).join("L")}Z`;
}

/**
 * Bin points into pointy-top hexagons of the given radius. A point lands
 * in the hexagon whose center is nearest. Bins come back in first-seen
 * order with their center and the indices of the points inside.
 *
 * @param {ReadonlyArray<{ x: number; y: number } | null | undefined>} points
 * @param {number} radius
 * @returns {import("./hexbin.d.ts").HexBin[]}
 */
export function hexbin(points, radius) {
  const dx = radius * 2 * Math.sin(THIRD);
  const dy = radius * 1.5;
  /** @type {Map<string, import("./hexbin.d.ts").HexBin>} */
  const bins = new Map();
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    // Rows alternate a half step: an odd row is offset by half a hexagon.
    const py = point.y / dy;
    let pj = Math.round(py);
    let px = point.x / dx - (pj & 1) / 2;
    let pi = Math.round(px);
    const py1 = py - pj;
    // Near a row boundary the nearest center may be in the other row.
    if (Math.abs(py1) * 3 > 1) {
      const px1 = px - pi;
      const pi2 = pi + (px < pi ? -1 : 1) / 2;
      const pj2 = pj + (py < pj ? -1 : 1);
      const px2 = px - pi2;
      const py2 = py - pj2;
      if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) {
        pi = pi2 + (pj & 1 ? 1 : -1) / 2;
        pj = pj2;
        px = point.x / dx - (pj & 1) / 2;
      }
    }
    const key = `${pi},${pj}`;
    let bin = bins.get(key);
    if (!bin) {
      bin = {
        key,
        x: (pi + (pj & 1) / 2) * dx,
        y: pj * dy,
        count: 0,
        indices: [],
      };
      bins.set(key, bin);
    }
    bin.count += 1;
    bin.indices.push(index);
  }
  return [...bins.values()];
}
