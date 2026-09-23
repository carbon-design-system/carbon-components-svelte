// @ts-check
// Row geometry for `ForestPlot`: a point estimate and its interval per
// row, a pooled diamond, and the line of no effect.

import { scaleLinear } from "../utils/scale-linear.js";
import { logTicks, niceLogDomain, scaleLog } from "../utils/scale-log.js";
import { niceDomain, ticks } from "../utils/ticks.js";

/**
 * A row per study with its estimate and interval placed on one shared
 * scale, linear or log, that always holds every interval and the null.
 * A marker's size follows its weight, when weights are given.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./forest-geometry.d.ts").ForestOptions<T>} options
 * @returns {import("./forest-geometry.d.ts").Forest<T>}
 */
export function buildForest(rows, options) {
  const {
    label,
    estimate,
    lo,
    hi,
    weight,
    overall,
    nullValue,
    scale: kind = "linear",
    plotWidth,
    rowHeight,
    markerSize = [6, 14],
  } = options;

  const read = (/** @type {unknown} */ raw) => {
    const value = raw === null || raw === undefined ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : Number.NaN;
  };
  const entries = rows.flatMap((row, i) => {
    const point = read(estimate(row, i));
    const low = read(lo(row, i));
    const high = read(hi(row, i));
    if (!Number.isFinite(point)) return [];
    return [
      {
        index: i,
        row,
        label: String(label(row, i) ?? i),
        estimate: point,
        lo: Number.isFinite(low) ? Math.min(low, point) : point,
        hi: Number.isFinite(high) ? Math.max(high, point) : point,
        weight: weight ? read(weight(row, i)) : Number.NaN,
      },
    ];
  });

  const values = entries.flatMap((entry) => [entry.lo, entry.hi]);
  if (overall) values.push(overall.lo, overall.hi, overall.estimate);
  if (nullValue !== undefined) values.push(nullValue);
  let min = values.length ? Math.min(...values) : 0;
  let max = values.length ? Math.max(...values) : 1;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const useLog = kind === "log" && min > 0;
  const domain = useLog ? niceLogDomain(min, max) : niceDomain(min, max, 5);
  const axis = useLog
    ? scaleLog({ domain, range: [0, plotWidth] })
    : scaleLinear({ domain, range: [0, plotWidth] });
  const tickValues = useLog
    ? logTicks(domain[0], domain[1])
    : ticks(domain[0], domain[1], 5);

  const weights = entries
    .map((entry) => entry.weight)
    .filter((value) => Number.isFinite(value));
  const heaviest = weights.length ? Math.max(...weights) : Number.NaN;
  const lightest = weights.length ? Math.min(...weights) : Number.NaN;
  const [small, large] = markerSize;

  const placed = entries.map((entry, order) => {
    const x = axis.map(entry.estimate);
    // The interval is clear of the null when it does not contain it.
    const clear =
      nullValue === undefined || entry.lo > nullValue || entry.hi < nullValue;
    const size =
      Number.isFinite(entry.weight) && heaviest > lightest
        ? small +
          ((entry.weight - lightest) / (heaviest - lightest)) * (large - small)
        : Number.isFinite(entry.weight)
          ? large
          : small;
    return {
      ...entry,
      order,
      y: (order + 0.5) * rowHeight,
      x,
      x0: axis.map(entry.lo),
      x1: axis.map(entry.hi),
      size,
      clear,
    };
  });

  const rowsHeight = placed.length * rowHeight;
  const pooled = overall
    ? (() => {
        const y = rowsHeight + rowHeight / 2;
        const x = axis.map(overall.estimate);
        const x0 = axis.map(overall.lo);
        const x1 = axis.map(overall.hi);
        const half = rowHeight * 0.3;
        return {
          label: overall.label ?? "Overall",
          estimate: overall.estimate,
          lo: overall.lo,
          hi: overall.hi,
          y,
          x,
          x0,
          x1,
          d: `M${x0},${y}L${x},${y - half}L${x1},${y}L${x},${y + half}Z`,
          clear:
            nullValue === undefined ||
            overall.lo > nullValue ||
            overall.hi < nullValue,
        };
      })()
    : null;

  return {
    rows: placed,
    overall: pooled,
    nullX: nullValue === undefined ? null : axis.map(nullValue),
    ticks: tickValues.map((value) => ({ value, x: axis.map(value) })),
    domain,
    log: useLog,
    height: rowsHeight + (pooled ? rowHeight : 0),
  };
}
