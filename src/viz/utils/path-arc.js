// @ts-check
// SVG arcs for donut, pie, and gauge marks. Angles are radians, `0` at
// 12 o'clock, increasing clockwise.

/** @typedef {import("./path-arc.d.ts").ArcOptions} ArcOptions */
/** @typedef {import("./path-arc.d.ts").PieOptions} PieOptions */
/** @typedef {import("./path-arc.d.ts").PieSlice} PieSlice */

const TAU = Math.PI * 2;

/** @param {number} value */
function fmt(value) {
  return `${Math.round(value * 100) / 100}`;
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} angle
 * @returns {string}
 */
function pointAt(cx, cy, radius, angle) {
  return `${fmt(cx + radius * Math.sin(angle))},${fmt(cy - radius * Math.cos(angle))}`;
}

/**
 * SVG path `d` for an annular sector. `innerRadius: 0` gives a pie wedge. A
 * span of a full turn or more draws a complete ring from two half arcs,
 * since one SVG arc cannot return to its own start.
 *
 * @param {ArcOptions} options
 * @returns {string}
 */
export function pathArc({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius,
  startAngle,
  endAngle,
  padAngle = 0,
}) {
  let a0 = Math.min(startAngle, endAngle);
  let a1 = Math.max(startAngle, endAngle);
  const r0 = Math.max(0, Math.min(innerRadius, outerRadius));
  const r1 = Math.max(innerRadius, outerRadius);
  if (!(r1 > 0) || !Number.isFinite(a0) || !Number.isFinite(a1)) return "";

  if (a1 - a0 >= TAU - 1e-9) {
    const ring = (/** @type {number} */ r, /** @type {0 | 1} */ sweep) =>
      `M${pointAt(cx, cy, r, 0)}A${fmt(r)},${fmt(r)},0,1,${sweep},${pointAt(cx, cy, r, Math.PI)}A${fmt(r)},${fmt(r)},0,1,${sweep},${pointAt(cx, cy, r, 0)}Z`;
    return r0 > 0 ? ring(r1, 1) + ring(r0, 0) : ring(r1, 1);
  }

  const pad = Math.min(Math.max(0, padAngle), a1 - a0) / 2;
  a0 += pad;
  a1 -= pad;
  if (!(a1 > a0)) return "";

  const large = a1 - a0 > Math.PI ? 1 : 0;
  const outer = `M${pointAt(cx, cy, r1, a0)}A${fmt(r1)},${fmt(r1)},0,${large},1,${pointAt(cx, cy, r1, a1)}`;
  if (r0 === 0) return `${outer}L${fmt(cx)},${fmt(cy)}Z`;
  return `${outer}L${pointAt(cx, cy, r0, a1)}A${fmt(r0)},${fmt(r0)},0,${large},0,${pointAt(cx, cy, r0, a0)}Z`;
}

/**
 * Midpoint of an arc, for placing a label or tooltip anchor.
 *
 * @param {ArcOptions} options
 * @returns {{ x: number, y: number }}
 */
export function arcCentroid({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius,
  startAngle,
  endAngle,
}) {
  const radius = (innerRadius + outerRadius) / 2;
  const angle = (startAngle + endAngle) / 2;
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}

/**
 * Divide an angular span among `values` in proportion. Negative and
 * non-finite values count as zero. When every value is zero, slices are all
 * zero-width rather than `NaN`.
 *
 * @param {ReadonlyArray<number>} values
 * @param {PieOptions} [options]
 * @returns {PieSlice[]}
 */
export function pieAngles(values, options = {}) {
  const {
    startAngle = 0,
    endAngle = TAU,
    padAngle = 0,
    sort = false,
  } = options;
  const n = values.length;
  /** @type {number[]} */
  const clean = new Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const value = values[i];
    clean[i] = Number.isFinite(value) && value > 0 ? value : 0;
    total += clean[i];
  }

  /** @type {number[]} */
  const order = Array.from({ length: n }, (_, i) => i);
  if (sort) order.sort((a, b) => clean[b] - clean[a] || a - b);

  const span = endAngle - startAngle;
  /** @type {PieSlice[]} */
  const slices = new Array(n);
  let angle = startAngle;
  for (const index of order) {
    const sweep = total > 0 ? (clean[index] / total) * span : 0;
    slices[index] = {
      index,
      value: clean[index],
      startAngle: angle,
      endAngle: angle + sweep,
      padAngle,
    };
    angle += sweep;
  }
  return slices;
}
