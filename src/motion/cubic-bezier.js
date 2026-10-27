// @ts-check

const EPSILON = 1e-6;

/**
 * Build the easing function for a CSS `cubic-bezier(x1, y1, x2, y2)` curve.
 * `svelte/easing` ships named curves but no solver, and Carbon's curves have
 * arbitrary control points. The result maps time `t` in [0, 1] to progress,
 * and clamps outside that range.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {(t: number) => number}
 */
export function cubicBezier(x1, y1, x2, y2) {
  if (x1 === y1 && x2 === y2) return (t) => t;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  /** @param {number} s */
  const sampleX = (s) => ((ax * s + bx) * s + cx) * s;
  /** @param {number} s */
  const sampleY = (s) => ((ay * s + by) * s + cy) * s;
  /** @param {number} s */
  const slopeX = (s) => (3 * ax * s + 2 * bx) * s + cx;

  /** @param {number} x */
  function solve(x) {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(s) - x;
      if (Math.abs(error) < EPSILON) return s;
      const slope = slopeX(s);
      if (Math.abs(slope) < EPSILON) break;
      s -= error / slope;
    }

    // Newton diverged or stalled on a flat slope: bisect.
    let low = 0;
    let high = 1;
    s = x;
    while (high - low > EPSILON) {
      const error = sampleX(s) - x;
      if (Math.abs(error) < EPSILON) break;
      if (error > 0) high = s;
      else low = s;
      s = (low + high) / 2;
    }
    return s;
  }

  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solve(t)));
}
