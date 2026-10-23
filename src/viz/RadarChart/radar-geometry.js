// @ts-check
// Spoke, ring, and polygon geometry for `RadarChart`, kept out of the
// component so a test can count how often it runs.

import { niceDomain, ticks } from "../utils/ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/** @param {number} n */
function round(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Lay rows out on spokes: one per distinct `axis` value, in first-seen
 * order, clockwise from 12 o'clock. Every spoke shares one radial scale from
 * zero, so the axes must share a unit. A series with no row on a spoke
 * counts as zero there, since a polygon cannot have a gap. Rows that share a
 * series and a spoke are summed.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./radar-geometry.d.ts").RadarOptions<T>} options
 * @returns {import("./radar-geometry.d.ts").Radar}
 */
export function buildRadar(rows, options) {
  const {
    axis,
    value,
    series,
    radius,
    cx,
    cy,
    max: fixedMax,
    hidden = [],
    palette = 1,
    colors = {},
    labelOffset = 12,
  } = options;

  /** @type {string[]} */
  const axisKeys = [];
  /** @type {Map<string, number>} */
  const axisIndex = new Map();
  /** @type {Map<string, number[]>} */
  const bySeries = new Map();
  for (let i = 0; i < rows.length; i++) {
    const spoke = String(axis(rows[i], i));
    if (!axisIndex.has(spoke)) {
      axisIndex.set(spoke, axisKeys.length);
      axisKeys.push(spoke);
    }
    const key = String(series(rows[i], i));
    if (!bySeries.has(key)) bySeries.set(key, []);
  }
  const n = axisKeys.length;
  for (const values of bySeries.values()) {
    values.length = n;
    values.fill(0);
  }
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(value(rows[i], i));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const values = /** @type {number[]} */ (
      bySeries.get(String(series(rows[i], i)))
    );
    values[/** @type {number} */ (axisIndex.get(String(axis(rows[i], i))))] +=
      amount;
  }

  let top = 0;
  for (const [key, values] of bySeries) {
    if (hidden.includes(key)) continue;
    for (const amount of values) top = Math.max(top, amount);
  }
  const max =
    fixedMax !== undefined && fixedMax > 0
      ? fixedMax
      : top > 0
        ? niceDomain(0, top, 4)[1]
        : 1;
  const levels = ticks(0, max, 4).filter((level) => level > 0);

  /**
   * @param {number} index
   * @param {number} r
   */
  function at(index, r) {
    const angle = (index / Math.max(n, 1)) * Math.PI * 2;
    return { x: cx + Math.sin(angle) * r, y: cy - Math.cos(angle) * r };
  }
  /** @param {(index: number) => number} radiusOf */
  function polygon(radiusOf) {
    const parts = new Array(n);
    for (let i = 0; i < n; i++) {
      const point = at(i, radiusOf(i));
      parts[i] = `${round(point.x)},${round(point.y)}`;
    }
    return parts.join(" ");
  }

  const assigned = categoricalColors(bySeries.size, palette);
  return {
    max,
    axes: axisKeys.map((key, i) => {
      const end = at(i, radius);
      const label = at(i, radius + labelOffset);
      const sin = Math.sin((i / n) * Math.PI * 2);
      return {
        key,
        index: i,
        x: round(end.x),
        y: round(end.y),
        labelX: round(label.x),
        labelY: round(label.y),
        // Labels grow away from the chart on either side, and center on top
        // and bottom.
        anchor: sin > 0.1 ? "start" : sin < -0.1 ? "end" : "middle",
      };
    }),
    rings: levels.map((level) => ({
      value: level,
      points: polygon(() => (level / max) * radius),
      labelY: round(cy - (level / max) * radius),
    })),
    series: [...bySeries].map(([key, values], s) => ({
      key,
      hidden: hidden.includes(key),
      color:
        colors[key] === undefined
          ? assigned[s]
          : (vizColor(colors[key]) ?? assigned[s]),
      values,
      points: polygon((i) => (Math.min(values[i], max) / max) * radius),
      vertices: values.map((amount, i) => {
        const point = at(i, (Math.min(amount, max) / max) * radius);
        return { x: round(point.x), y: round(point.y), value: amount };
      }),
    })),
  };
}

/**
 * Index of the spoke nearest a point, by angle.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} count
 * @returns {number}
 */
export function nearestSpoke(x, y, cx, cy, count) {
  if (count <= 0) return -1;
  // `atan2(dx, -dy)` is 0 at 12 o'clock and grows clockwise.
  const angle = (Math.atan2(x - cx, -(y - cy)) + Math.PI * 2) % (Math.PI * 2);
  return Math.round((angle / (Math.PI * 2)) * count) % count;
}
