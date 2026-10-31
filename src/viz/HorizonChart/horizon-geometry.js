// @ts-check
// Band geometry for `HorizonChart`: each series cut into layers of equal
// height and folded onto one short row, kept out of the component so a test
// can count how often it runs.

import { sequentialColor } from "../utils/color-scale.js";
import { pathArea } from "../utils/path-area.js";
import { scaleLinear } from "../utils/scale-linear.js";
import { scaleTime } from "../utils/scale-time.js";
import { niceDomain, ticks } from "../utils/ticks.js";
import { timeTickFormat, timeTicks } from "../utils/time-ticks.js";

/**
 * @param {unknown} value
 * @returns {number}
 */
function toX(value) {
  if (value instanceof Date) return value.getTime();
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

/**
 * Group rows by series, in first-seen order, each sorted by x, and cut
 * every series into `bands` layers of `max / bands` each. Layer `k` holds
 * the part of the value between `k` and `k + 1` steps, drawn over the whole
 * row height, so a tall value is a darker stack rather than a taller one.
 * Values below zero fold the same way into layers of their own, told apart
 * by hue. Every series shares one x scale from the earliest to the latest
 * x, and `max` defaults to the largest magnitude, rounded out.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./horizon-geometry.d.ts").HorizonOptions<T>} options
 * @returns {import("./horizon-geometry.d.ts").Horizon<T>}
 */
export function buildHorizon(rows, options) {
  const {
    x,
    y,
    series,
    bands = 3,
    max,
    plot,
    rowHeight,
    hue = "blue",
    negativeHue = "purple",
    locale,
    utc,
  } = options;

  /** @type {Map<string, Array<{ x: number; y: number; row: T; index: number }>>} */
  const bySeries = new Map();
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  let largest = 0;
  let time = false;
  for (let i = 0; i < rows.length; i++) {
    const raw = x(rows[i], i);
    if (raw instanceof Date) time = true;
    const at = toX(raw);
    const value = Number(y(rows[i], i) ?? Number.NaN);
    if (!Number.isFinite(at)) continue;
    const key = String(series ? series(rows[i], i) : "");
    let list = bySeries.get(key);
    if (!list) {
      list = [];
      bySeries.set(key, list);
    }
    list.push({ x: at, y: value, row: rows[i], index: i });
    if (at < low) low = at;
    if (at > high) high = at;
    if (Number.isFinite(value) && Math.abs(value) > largest) {
      largest = Math.abs(value);
    }
  }
  /** @type {[number, number]} */
  const domain = low <= high ? [low, high] : [0, 1];
  const top =
    max !== undefined && max > 0 ? max : niceDomain(0, largest || 1, 3)[1];
  const step = top / Math.max(1, Math.floor(bands));
  const layers = Math.max(1, Math.floor(bands));
  const xScale = time
    ? scaleTime({ domain, range: [plot.x0, plot.x1] })
    : scaleLinear({ domain, range: [plot.x0, plot.x1] });

  /** @type {number[]} */
  const allXs = [];
  const seen = new Set();
  const out = [...bySeries].map(([key, list], index) => {
    list.sort((a, b) => a.x - b.x);
    const xs = list.map((point) => point.x);
    const ys = list.map((point) => point.y);
    for (const value of xs) {
      if (!seen.has(value)) {
        seen.add(value);
        allXs.push(value);
      }
    }
    const px = xs.map((value) => xScale.map(value));
    /** @type {Array<{ level: number; d: string; color: string }>} */
    const folded = [];
    for (const sign of [1, -1]) {
      for (let k = 0; k < layers; k++) {
        const floor = k * step;
        // Each layer is the value clipped to its own slice, then scaled to
        // the full row height. Below the slice it is flat at the row's
        // bottom; above, flat at the top.
        const points = ys.map((value, i) => {
          const magnitude = sign * value;
          if (!Number.isFinite(value) || magnitude <= 0) return null;
          const part = Math.min(Math.max(magnitude - floor, 0), step);
          return { x: px[i], y: rowHeight - (part / step) * rowHeight };
        });
        if (!points.some((point) => point && point.y < rowHeight)) continue;
        folded.push({
          level: sign * (k + 1),
          d: pathArea(points, rowHeight, { precision: 1 }),
          color: sequentialColor(
            (k + 1) / layers,
            sign > 0 ? hue : negativeHue,
            {
              minStep: 2,
            },
          ),
        });
      }
    }
    return {
      key,
      index,
      xs,
      ys,
      rows: list.map((point) => point.row),
      bands: folded,
      last: ys.length > 0 ? ys[ys.length - 1] : Number.NaN,
      min: Math.min(...ys.filter(Number.isFinite)),
      max: Math.max(...ys.filter(Number.isFinite)),
    };
  });
  allXs.sort((a, b) => a - b);

  /** @type {Array<{ value: number; px: number; label: string }>} */
  let axis;
  /** @type {(value: number) => string} */
  let xLabel;
  if (time) {
    const result = timeTicks(domain[0], domain[1], 5, { utc });
    const write = timeTickFormat(result.interval, locale, { utc });
    axis = result.values
      .filter((value) => value >= domain[0] && value <= domain[1])
      .map((value) => ({ value, px: xScale.map(value), label: write(value) }));
    const full = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      ...(utc ? { timeZone: "UTC" } : {}),
    });
    xLabel = (value) => full.format(value);
  } else {
    const format = new Intl.NumberFormat(locale);
    axis = ticks(domain[0], domain[1], 5).map((value) => ({
      value,
      px: xScale.map(value),
      label: format.format(value),
    }));
    xLabel = (value) => format.format(value);
  }

  return {
    domain,
    step,
    layers,
    top,
    xs: allXs,
    series: out,
    ticks: axis,
    xLabel,
    x: xScale,
  };
}
