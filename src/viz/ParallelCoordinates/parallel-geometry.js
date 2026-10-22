// @ts-check
// Axis and line geometry for `ParallelCoordinates`, kept out of the
// component so a test can count how often it runs.

import { pathLine } from "../utils/path-line.js";
import { scaleLinear } from "../utils/scale-linear.js";
import { niceDomain, ticks } from "../utils/ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNumber(value) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

/**
 * One vertical axis per dimension, evenly spaced, each on its own scale
 * from the dimension's extent rounded out, and one polyline per row through
 * them. A row missing a dimension has a gap there. Rows are colored by
 * series in first-seen order, or all alike without one.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./parallel-geometry.d.ts").ParallelOptions<T>} options
 * @returns {import("./parallel-geometry.d.ts").Parallel<T>}
 */
export function buildParallel(rows, options) {
  const {
    dimensions,
    series,
    label,
    hidden = [],
    palette = 1,
    colors = {},
    plot,
  } = options;

  const specs = dimensions.map((dimension) =>
    typeof dimension === "string"
      ? { key: dimension, label: dimension, domain: undefined }
      : {
          key: dimension.key,
          label: dimension.label ?? dimension.key,
          domain: dimension.domain,
        },
  );
  const count = specs.length;
  const gap = count > 1 ? (plot.x1 - plot.x0) / (count - 1) : 0;

  /** @type {number[][]} */
  const values = rows.map((row) =>
    specs.map((spec) => toNumber(/** @type {any} */ (row)?.[spec.key])),
  );
  const axes = specs.map((spec, d) => {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < values.length; i++) {
      const value = values[i][d];
      if (!Number.isFinite(value)) continue;
      if (value < low) low = value;
      if (value > high) high = value;
    }
    const domain = spec.domain
      ? /** @type {[number, number]} */ ([spec.domain[0], spec.domain[1]])
      : low <= high
        ? niceDomain(low, high, 4)
        : /** @type {[number, number]} */ ([0, 1]);
    const scale = scaleLinear({ domain, range: [plot.y1, plot.y0] });
    return {
      key: spec.key,
      label: spec.label,
      index: d,
      x: count > 1 ? plot.x0 + gap * d : (plot.x0 + plot.x1) / 2,
      domain,
      scale,
      ticks: ticks(domain[0], domain[1], 3).map((value) => ({
        value,
        y: scale.map(value),
      })),
    };
  });

  /** @type {string[]} */
  const keys = [];
  const seriesOfRow = rows.map((row, i) => {
    const key = series ? String(series(row, i)) : "";
    if (!keys.includes(key)) keys.push(key);
    return key;
  });
  const assigned = categoricalColors(keys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  keys.forEach((key, i) => {
    colorOf.set(
      key,
      colors[key] === undefined
        ? assigned[i]
        : (vizColor(colors[key]) ?? assigned[i]),
    );
  });
  const hiddenKeys = new Set(hidden.map(String));

  const lines = rows.map((row, i) => {
    const points = axes.map((axis, d) => {
      const value = values[i][d];
      return Number.isFinite(value)
        ? { x: axis.x, y: axis.scale.map(value) }
        : null;
    });
    return {
      id: String(i),
      index: i,
      label: label ? String(label(row, i) ?? i) : String(i),
      series: seriesOfRow[i],
      color: /** @type {string} */ (colorOf.get(seriesOfRow[i])),
      hidden: hiddenKeys.has(seriesOfRow[i]),
      values: values[i],
      points,
      d: pathLine(points, { precision: 1 }),
      datum: row,
    };
  });

  return {
    axes,
    lines,
    series: keys.map((key) => ({
      key,
      color: /** @type {string} */ (colorOf.get(key)),
      hidden: hiddenKeys.has(key),
    })),
  };
}

/**
 * Whether a row passes every brush: each brushed dimension's value inside
 * its range. A row missing a brushed dimension fails.
 *
 * @param {ReadonlyArray<number>} values Value per dimension, in axis order.
 * @param {ReadonlyArray<{ index: number; range: readonly [number, number] }>} brushes
 */
export function passesBrushes(values, brushes) {
  for (const brush of brushes) {
    const value = values[brush.index];
    const low = Math.min(brush.range[0], brush.range[1]);
    const high = Math.max(brush.range[0], brush.range[1]);
    if (!Number.isFinite(value) || value < low || value > high) return false;
  }
  return true;
}

/**
 * The line nearest a point: on the segment the point's x falls in, the one
 * whose y there is closest. `-1` when none is within `within` pixels.
 *
 * @param {ReadonlyArray<{ points: ReadonlyArray<{ x: number; y: number } | null>; hidden: boolean; kept: boolean }>} lines
 * @param {ReadonlyArray<{ x: number }>} axes
 * @param {number} x
 * @param {number} y
 * @param {number} [within]
 */
export function nearestLine(lines, axes, x, y, within = 12) {
  if (axes.length === 0) return -1;
  let d = 0;
  while (d < axes.length - 2 && x > axes[d + 1].x) d++;
  const single = axes.length === 1;
  const t = single
    ? 0
    : Math.min(
        Math.max((x - axes[d].x) / (axes[d + 1].x - axes[d].x || 1), 0),
        1,
      );
  let best = -1;
  let least = within;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.hidden || !line.kept) continue;
    const a = line.points[d];
    const b = single ? a : line.points[d + 1];
    if (!a || !b) continue;
    const at = a.y + (b.y - a.y) * t;
    const distance = Math.abs(at - y);
    if (distance < least) {
      least = distance;
      best = i;
    }
  }
  return best;
}
