// @ts-check
// Line and label geometry for `SlopeChart`: two columns of values and a
// line per series between them.

import { spreadLabels } from "../utils/spread-labels.js";
import { niceDomain } from "./../utils/ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * A line per series from its value in the first period to its value in the
 * second. A series missing either period is left out.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./slope-geometry.d.ts").SlopeOptions<T>} options
 * @returns {import("./slope-geometry.d.ts").Slope<T>}
 */
export function buildSlope(rows, options) {
  const {
    x,
    y,
    series,
    label,
    periods,
    width,
    height,
    labelWidth,
    labelGap = 16,
    zero = false,
    palette = 1,
    colors = {},
  } = options;

  /** @type {string[]} */
  const seen = [];
  /** @type {Map<string, { from?: { value: number; row: T; index: number }; to?: { value: number; row: T; index: number }; label: string }>} */
  const bySeries = new Map();
  rows.forEach((row, i) => {
    const period = String(x(row, i));
    if (!seen.includes(period)) seen.push(period);
  });
  const [from, to] = periods ? periods.map(String) : seen;
  if (from === undefined || to === undefined) {
    return {
      periods: [from ?? "", to ?? ""],
      lines: [],
      x0: 0,
      x1: width,
      domain: [0, 1],
      ticks: [],
    };
  }
  rows.forEach((row, i) => {
    const period = String(x(row, i));
    if (period !== from && period !== to) return;
    const key = String(series(row, i));
    const raw = y(row, i);
    const value = raw === null || raw === undefined ? Number.NaN : Number(raw);
    if (!Number.isFinite(value)) return;
    let entry = bySeries.get(key);
    if (!entry) {
      entry = { label: label ? String(label(row, i) ?? key) : key };
      bySeries.set(key, entry);
    }
    entry[period === from ? "from" : "to"] = { value, row, index: i };
  });

  const pairs = [...bySeries.entries()].filter(
    (entry) => entry[1].from && entry[1].to,
  );
  const values = pairs.flatMap(([, entry]) => [
    /** @type {number} */ (entry.from?.value),
    /** @type {number} */ (entry.to?.value),
  ]);
  let lo = values.length ? Math.min(...values) : 0;
  let hi = values.length ? Math.max(...values) : 1;
  if (zero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const [d0, d1] = niceDomain(lo, hi, 4);
  const place = (/** @type {number} */ value) =>
    height - ((value - d0) / (d1 - d0)) * height;

  const keys = pairs.map(([key]) => key);
  const assigned = categoricalColors(keys.length, palette);
  const x0 = labelWidth;
  const x1 = width - labelWidth;
  const y1s = pairs.map(([, entry]) =>
    place(/** @type {number} */ (entry.from?.value)),
  );
  const y2s = pairs.map(([, entry]) =>
    place(/** @type {number} */ (entry.to?.value)),
  );
  const leftYs = spreadLabels(y1s, labelGap, 0, height);
  const rightYs = spreadLabels(y2s, labelGap, 0, height);
  const lines = pairs.map(([key, entry], i) => {
    const start = /** @type {number} */ (entry.from?.value);
    const end = /** @type {number} */ (entry.to?.value);
    const fixed = colors[key];
    return {
      key,
      index: i,
      label: entry.label,
      from: start,
      to: end,
      change: end - start,
      direction: end > start ? "up" : end < start ? "down" : "flat",
      y1: y1s[i],
      y2: y2s[i],
      leftY: leftYs[i],
      rightY: rightYs[i],
      color:
        fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
      fromDatum: /** @type {T} */ (entry.from?.row),
      toDatum: /** @type {T} */ (entry.to?.row),
    };
  });

  return {
    periods: [from, to],
    lines,
    x0,
    x1,
    domain: [d0, d1],
    ticks: [d0, d1].map((value) => ({ value, y: place(value) })),
  };
}
