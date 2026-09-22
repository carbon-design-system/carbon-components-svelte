// @ts-check
// Circle packing: place circles of given radii close together, no overlap.

const EPSILON = 1e-6;
/** @type {Array<{ x: number; y: number }>} */
const NONE = [];

/**
 * The two points where a circle of radius `r` touches both `a` and `b`.
 *
 * @param {{ x: number; y: number; r: number }} a
 * @param {{ x: number; y: number; r: number }} b
 * @param {number} r
 * @returns {Array<{ x: number; y: number }>}
 */
function tangentSpots(a, b, r) {
  const ra = a.r + r;
  const rb = b.r + r;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Most pairs are too far apart for the new circle to touch both. Squares
  // settle that before the square root is worth taking.
  const d2 = dx * dx + dy * dy;
  const reach = ra + rb;
  if (d2 === 0 || d2 > reach * reach) return NONE;
  const d = Math.sqrt(d2);
  if (d < Math.abs(ra - rb)) return NONE;
  // Intersect the circles of radius `ra` around a and `rb` around b.
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(ra * ra - along * along, 0));
  const mx = a.x + (dx * along) / d;
  const my = a.y + (dy * along) / d;
  return [
    { x: mx - (dy * off) / d, y: my + (dx * off) / d },
    { x: mx + (dy * off) / d, y: my - (dx * off) / d },
  ];
}

/**
 * Pack circles around the origin. Largest first: each circle goes to the
 * spot nearest the center where it touches two circles already placed and
 * overlaps none. Output is in input order, with the smallest circle that
 * holds them all, centered on the origin. A radius that is not positive gets
 * a circle of radius 0 at the origin.
 *
 * Every pair is tried for every circle, which is cubic in the worst case and
 * keeps the result deterministic. In practice almost every pair is rejected
 * by one comparison, so a few hundred circles take a few milliseconds.
 *
 * @param {ReadonlyArray<number>} radii
 * @param {{ padding?: number }} [options]
 * @returns {import("./pack-circles.d.ts").Packing}
 */
export function packCircles(radii, { padding = 0 } = {}) {
  const n = radii.length;
  /** @type {import("./pack-circles.d.ts").PackedCircle[]} */
  const circles = new Array(n);
  /** @type {number[]} */
  const order = [];
  for (let i = 0; i < n; i++) {
    const r = Number.isFinite(radii[i]) && radii[i] > 0 ? radii[i] : 0;
    circles[i] = { x: 0, y: 0, r };
    if (r > 0) order.push(i);
  }
  order.sort((a, b) => circles[b].r - circles[a].r || a - b);

  /** @type {Array<{ x: number; y: number; r: number; d: number }>} */
  const placed = [];
  for (const index of order) {
    const circle = circles[index];
    // Padding is a halo each circle carries while it is being placed.
    const r = circle.r + padding / 2;
    if (placed.length === 0) {
      placed.push({ x: 0, y: 0, r, d: 0 });
      continue;
    }
    if (placed.length === 1) {
      const first = placed[0];
      circle.x = first.r + r;
      placed.push({ x: circle.x, y: 0, r, d: circle.x });
      continue;
    }

    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestRadius = Number.POSITIVE_INFINITY;
    for (let i = 0; i < placed.length; i++) {
      // A spot touching `placed[i]` is at least this far from the center, so
      // once a nearer spot is known, circles further out cannot beat it.
      if (placed[i].d - placed[i].r - r > bestRadius) continue;
      for (let j = i + 1; j < placed.length; j++) {
        if (placed[j].d - placed[j].r - r > bestRadius) continue;
        for (const spot of tangentSpots(placed[i], placed[j], r)) {
          const distance = spot.x * spot.x + spot.y * spot.y;
          if (distance >= bestDistance) continue;
          let free = true;
          for (const other of placed) {
            const ox = spot.x - other.x;
            const oy = spot.y - other.y;
            const least = other.r + r - EPSILON;
            if (ox * ox + oy * oy < least * least) {
              free = false;
              break;
            }
          }
          if (free) {
            best = spot;
            bestDistance = distance;
            bestRadius = Math.sqrt(distance);
          }
        }
      }
    }
    // Unreachable for positive radii, but never leave a circle unplaced.
    const spot = best ?? { x: placed[placed.length - 1].x + r * 2, y: 0 };
    circle.x = spot.x;
    circle.y = spot.y;
    placed.push({ x: spot.x, y: spot.y, r, d: Math.hypot(spot.x, spot.y) });
  }

  if (order.length === 0) return { circles, radius: 0 };

  // The smallest circle that holds them all, by Bădoiu and Clarkson's
  // iteration: start at the bounding box's center and keep stepping toward
  // whichever circle sticks out furthest, by less each time. It closes in on
  // the true center fast enough that a hundred steps is within a fraction
  // of a percent.
  let x0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  for (const index of order) {
    const c = circles[index];
    x0 = Math.min(x0, c.x - c.r);
    x1 = Math.max(x1, c.x + c.r);
    y0 = Math.min(y0, c.y - c.r);
    y1 = Math.max(y1, c.y + c.r);
  }
  let cx = (x0 + x1) / 2;
  let cy = (y0 + y1) / 2;
  for (let step = 1; step <= 100; step++) {
    let far = circles[order[0]];
    let reach = -1;
    for (const index of order) {
      const c = circles[index];
      const d = Math.hypot(c.x - cx, c.y - cy) + c.r;
      if (d > reach) {
        reach = d;
        far = c;
      }
    }
    const d = Math.hypot(far.x - cx, far.y - cy);
    if (d === 0) break;
    // Aim at the far side of that circle, not its center.
    const pull = (d + far.r) / d / (step + 1);
    cx += (far.x - cx) * pull;
    cy += (far.y - cy) * pull;
  }
  let radius = 0;
  for (const index of order) {
    const c = circles[index];
    c.x -= cx;
    c.y -= cy;
    radius = Math.max(radius, Math.hypot(c.x, c.y) + c.r);
  }
  return { circles, radius };
}
