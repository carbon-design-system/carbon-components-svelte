// @ts-check
// Row geometry for `RidgelineChart`: a density curve per series on one
// shared scale, rows overlapping so the shapes read as a range.

import { kernelDensity } from "../utils/density.js";
import { quantile, sortedFinite } from "../utils/quantiles.js";
import { niceDomain, ticks } from "../utils/ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/** @param {number} value */
function r(value) {
  return Math.round(value * 100) / 100;
}

/**
 * A row per series in first-seen order, or by median, each with its
 * density sampled across one shared domain and scaled so every peak is
 * the same height. A row may rise into the row above it by `overlap`.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./ridgeline-geometry.d.ts").RidgelineOptions<T>} options
 * @returns {import("./ridgeline-geometry.d.ts").Ridgeline<T>}
 */
export function buildRidgeline(rows, options) {
  const {
    x,
    series,
    label,
    order = "none",
    width,
    rowHeight,
    overlap = 0.6,
    bandwidth,
    points = 64,
    colorBy = "none",
    palette = 1,
    colors = {},
  } = options;

  /** @type {Map<string, { key: string; label: string; values: number[]; datum: T; index: number }>} */
  const groups = new Map();
  rows.forEach((row, i) => {
    const key = String(series(row, i));
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: label ? String(label(row, i) ?? key) : key,
        values: [],
        datum: row,
        index: groups.size,
      };
      groups.set(key, group);
    }
    const raw = x(row, i);
    const value = raw === null || raw === undefined ? Number.NaN : Number(raw);
    if (Number.isFinite(value)) group.values.push(value);
  });

  const all = [...groups.values()].flatMap((group) => group.values);
  let lo = all.length ? Math.min(...all) : 0;
  let hi = all.length ? Math.max(...all) : 1;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  // Widen by the widest bandwidth so no tail is cut off.
  const densities = new Map(
    [...groups.values()].map((group) => [
      group.key,
      kernelDensity(group.values, { bandwidth, points, domain: [lo, hi] }),
    ]),
  );
  const widest = Math.max(
    ...[...densities.values()].map((density) => density.bandwidth),
    0,
  );
  const [d0, d1] = niceDomain(lo - 2 * widest, hi + 2 * widest, 5);
  const xOf = (/** @type {number} */ value) =>
    ((value - d0) / (d1 - d0)) * width;

  let ordered = [...groups.values()];
  const medianOf = new Map(
    ordered.map((group) => [
      group.key,
      quantile(sortedFinite(group.values), 0.5),
    ]),
  );
  if (order === "median") {
    ordered = [...ordered].sort(
      (a, b) =>
        (medianOf.get(a.key) ?? 0) - (medianOf.get(b.key) ?? 0) ||
        a.index - b.index,
    );
  }

  const assigned = categoricalColors(ordered.length, palette);
  const rise = rowHeight * (1 + overlap);
  // The first ridge needs room above its row to rise into.
  const pad = rowHeight * overlap;
  const placed = ordered.map((group, i) => {
    const baseline = pad + (i + 1) * rowHeight;
    const density = kernelDensity(group.values, {
      bandwidth,
      points,
      domain: [d0, d1],
    });
    const peak = density.peak || 1;
    const top = density.points.map(
      (point) => `${r(xOf(point.x))},${r(baseline - (point.y / peak) * rise)}`,
    );
    const line = top.length ? `M${top.join("L")}` : "";
    const area = top.length
      ? `${line}L${r(width)},${r(baseline)}L0,${r(baseline)}Z`
      : "";
    const fixed = colors[group.key];
    let peakX = d0;
    let best = -1;
    for (const point of density.points) {
      if (point.y > best) {
        best = point.y;
        peakX = point.x;
      }
    }
    return {
      key: group.key,
      label: group.label,
      index: group.index,
      order: i,
      y: baseline,
      line,
      area,
      count: density.count,
      median: medianOf.get(group.key) ?? Number.NaN,
      peak: peakX,
      color:
        fixed === undefined
          ? colorBy === "series"
            ? assigned[i]
            : undefined
          : (vizColor(fixed) ?? assigned[i]),
      datum: group.datum,
    };
  });

  return {
    rows: placed,
    domain: [d0, d1],
    ticks: ticks(d0, d1, 5).map((value) => ({ value, x: xOf(value) })),
    height: pad + (placed.length + 1) * rowHeight,
  };
}
