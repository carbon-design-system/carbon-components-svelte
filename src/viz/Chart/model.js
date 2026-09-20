// @ts-check
// Pure data model for `Chart`: rows to series groups, extents to scales.
// Kept DOM-free so the staging rules can be tested without rendering.

import { getDateTimeFormatter } from "../../utils/intl-formatter-cache.js";
import { groupBy } from "../utils/accessor.js";
import { formatCompact, resolveFormat } from "../utils/format-compact.js";
import { scalePoint } from "../utils/scale-band.js";
import { scaleLinear } from "../utils/scale-linear.js";
import { scaleTime } from "../utils/scale-time.js";
import { niceDomain, ticks } from "../utils/ticks.js";
import { timeTickFormat, timeTicks } from "../utils/time-ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/** @typedef {import("./model.d.ts").ChartGroup<any>} ChartGroup */
/** @typedef {import("./model.d.ts").ChartDomain} ChartDomain */
/** @typedef {import("./model.d.ts").ChartSize} ChartSize */
/** @typedef {import("./model.d.ts").ChartScales} ChartScales */

/** Average glyph width of 12px IBM Plex Sans, used to size margins and thin labels. */
export const GLYPH_WIDTH = 6.6;

const DAY = 86_400_000;

/**
 * Group rows into series and measure their extents in one pass per series.
 * A string `x` makes the axis categorical: `xs` then holds indexes into
 * `categories`, in first-seen order.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./model.d.ts").BuildGroupsOptions<T>} options
 * @returns {import("./model.d.ts").BuiltGroups<T>}
 */
export function buildGroups(
  rows,
  { x, y, series, hidden = [], colors, palette = 1, band = false, locale },
) {
  const grouped = groupBy(rows, series);
  const defaults = categoricalColors(grouped.size, palette);
  /** @type {string[]} */
  const categories = [];
  /** @type {Map<string, number>} */
  const categoryIndex = new Map();
  /** @type {"time" | "linear" | "category"} */
  let kind = "linear";

  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  /** @type {import("./model.d.ts").ChartGroup<T>[]} */
  const groups = [];
  let i = 0;
  for (const [key, groupRows] of grouped) {
    const isHidden = hidden.includes(key);
    const n = groupRows.length;
    /** @type {number[]} */
    const xs = new Array(n);
    /** @type {number[]} */
    const ys = new Array(n);
    for (let j = 0; j < n; j++) {
      const xv = x(groupRows[j], j);
      if (xv instanceof Date) {
        kind = "time";
        xs[j] = xv.getTime();
      } else if (typeof xv === "string") {
        kind = "category";
        let index = categoryIndex.get(xv);
        if (index === undefined) {
          index = categories.length;
          categoryIndex.set(xv, index);
          categories.push(xv);
        }
        xs[j] = index;
      } else {
        xs[j] = Number(xv);
      }
      // `Number(null)` is 0, which would plot a missing sample at zero.
      const yv = y(groupRows[j], j);
      ys[j] = yv === null || yv === undefined ? Number.NaN : Number(yv);
      if (isHidden) continue;
      if (xs[j] < xMin) xMin = xs[j];
      if (xs[j] > xMax) xMax = xs[j];
      if (Number.isFinite(ys[j])) {
        if (ys[j] < yMin) yMin = ys[j];
        if (ys[j] > yMax) yMax = ys[j];
      }
    }
    const override = colors?.[/** @type {string} */ (key)];
    groups.push({
      key,
      rows: groupRows,
      xs,
      ys,
      color:
        (override === undefined ? undefined : vizColor(override)) ??
        defaults[i] ??
        /** @type {string} */ (vizColor(i + 1)),
      hidden: isHidden,
    });
    i++;
  }

  // Bars need one slot per x. A numeric or time x becomes categories: its
  // distinct values in ascending order, labelled like a tooltip would.
  if (band && kind !== "category" && groups.length > 0) {
    /** @type {Set<number>} */
    const distinct = new Set();
    for (const group of groups) {
      for (const value of group.xs) {
        if (Number.isFinite(value)) distinct.add(value);
      }
    }
    const values = [...distinct].sort((a, b) => a - b);
    const label =
      kind === "time"
        ? bandDateLabel(values, locale)
        : (/** @type {number} */ value) => formatCompact(value, { locale });
    /** @type {Map<number, number>} */
    const slot = new Map();
    values.forEach((value, index) => {
      slot.set(value, index);
      categories.push(label(value));
    });
    for (const group of groups) {
      for (let j = 0; j < group.xs.length; j++) {
        group.xs[j] = slot.get(group.xs[j]) ?? Number.NaN;
      }
    }
    kind = "category";
    xMin = 0;
    xMax = Math.max(0, values.length - 1);
  }

  return {
    groups,
    kind,
    categories,
    xExtent: xMin <= xMax ? [xMin, xMax] : null,
    yExtent: yMin <= yMax ? [yMin, yMax] : null,
  };
}

/**
 * Label for a time value used as a bar category: as coarse as the spacing
 * between values allows, so monthly data reads "Jan", not "Jan 1, 2026".
 *
 * @param {ReadonlyArray<number>} values Ascending epoch milliseconds.
 * @param {string} [locale]
 * @returns {(value: number) => string}
 */
function bandDateLabel(values, locale) {
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < values.length; i++) {
    gap = Math.min(gap, values[i] - values[i - 1]);
  }
  const span = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  /** @type {Intl.DateTimeFormatOptions} */
  let options = { month: "short", day: "numeric" };
  if (gap >= 360 * DAY) options = { year: "numeric" };
  else if (gap >= 28 * DAY) {
    options =
      span >= 360 * DAY
        ? { month: "short", year: "2-digit" }
        : { month: "short" };
  } else if (gap < DAY) options = { hour: "numeric", minute: "2-digit" };
  const formatter = getDateTimeFormatter(locale, options);
  return (value) => formatter.format(value);
}

/**
 * Resolve the domain to plot from measured extents and the chart's options.
 *
 * @param {import("./model.d.ts").BuiltGroups<any>} built
 * @param {import("./model.d.ts").ResolveDomainOptions} options
 * @returns {ChartDomain}
 */
export function resolveDomain(
  built,
  { xDomain, yDomain = "nice", zero = true, include = [] },
) {
  let [y0, y1] = built.yExtent ?? [0, 1];
  for (const value of include) {
    if (!Number.isFinite(value)) continue;
    if (value < y0) y0 = value;
    if (value > y1) y1 = value;
  }
  if (zero) {
    y0 = Math.min(0, y0);
    y1 = Math.max(0, y1);
  }
  /** @type {[number, number]} */
  let y = Array.isArray(yDomain) ? [yDomain[0], yDomain[1]] : [y0, y1];
  if (yDomain === "nice") y = niceDomain(y[0], y[1], 5);

  const measured = built.xExtent ?? [0, 1];
  /** @type {[number, number]} */
  const x =
    built.kind === "category"
      ? [0, Math.max(0, built.categories.length - 1)]
      : xDomain
        ? [Number(xDomain[0]), Number(xDomain[1])]
        : [measured[0], measured[1]];

  return { x, y, kind: built.kind, categories: built.categories };
}

/**
 * Whether two domains plot identically. `Chart` publishes a new domain only
 * when this is false, so an in-range append leaves scales and axes alone.
 *
 * @param {ChartDomain | null} a
 * @param {ChartDomain} b
 * @returns {boolean}
 */
export function sameDomain(a, b) {
  if (!a) return false;
  if (a.kind !== b.kind) return false;
  if (a.x[0] !== b.x[0] || a.x[1] !== b.x[1]) return false;
  if (a.y[0] !== b.y[0] || a.y[1] !== b.y[1]) return false;
  if (a.categories.length !== b.categories.length) return false;
  for (let i = 0; i < a.categories.length; i++) {
    if (a.categories[i] !== b.categories[i]) return false;
  }
  return true;
}

/**
 * Scales, ticks, formatters, and the plot box for a domain at a size. The
 * left margin is estimated from the formatted y tick labels, so it needs no
 * DOM measurement and mount settles without an extra pass.
 *
 * @param {ChartDomain} domain
 * @param {ChartSize} size
 * @param {import("./model.d.ts").BuildScalesOptions} [options]
 * @returns {ChartScales}
 */
export function buildScales(domain, size, options = {}) {
  const { locale, margin: marginOverride = {}, reserved = [] } = options;
  // Space marks asked for, such as an axis title, on top of the defaults.
  const extra = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const { side, px } of reserved) extra[side] += px;
  const top = marginOverride.top ?? 8 + extra.top;
  const bottom = marginOverride.bottom ?? 28 + extra.bottom;
  const right = marginOverride.right ?? 16 + extra.right;

  const yFormat = options.yFormat
    ? resolveFormat(options.yFormat, locale)
    : (/** @type {number} */ value) => formatCompact(value, { locale });
  const plotHeight = Math.max(1, size.height - top - bottom);
  const yTicks = ticks(
    domain.y[0],
    domain.y[1],
    Math.max(2, Math.round(plotHeight / 56)),
  );

  let longest = 0;
  for (const tick of yTicks) longest = Math.max(longest, yFormat(tick).length);
  const left =
    marginOverride.left ??
    Math.round(longest * GLYPH_WIDTH * 1.15 + 14) + extra.left;

  const x0 = left;
  const x1 = Math.max(left + 1, size.width - right);
  const plotWidth = x1 - x0;
  const y = scaleLinear({
    domain: domain.y,
    range: [size.height - bottom, top],
  });

  /** @type {ChartScales["x"]} */
  let x;
  /** @type {number[]} */
  let xTicks;
  /** @type {(value: number) => string} */
  let xFormat;
  /** @type {(value: number) => string} */
  let xLabel;
  /** @type {number | undefined} */
  let step;

  if (domain.kind === "category") {
    const point = scalePoint({
      domain: domain.categories,
      range: [x0, x1],
      padding: 0.5,
    });
    const last = domain.categories.length - 1;
    x = {
      map: (index) =>
        point.map(domain.categories[Math.round(Number(index))]) ?? x0,
      invert: (px) => {
        if (last < 0 || point.step === 0) return 0;
        const first = point.map(domain.categories[0]) ?? x0;
        return Math.min(
          last,
          Math.max(0, Math.round((px - first) / point.step)),
        );
      },
    };
    xTicks = domain.categories.map((_, index) => index);
    xFormat = (index) => domain.categories[index] ?? "";
    xLabel = xFormat;
    // Categories sit at the centers of equal slots, so a bar mark can use
    // the same scale: `x.map(i)` is the slot center and `step` its width.
    step = point.step;
  } else if (domain.kind === "time") {
    const time = scaleTime({ domain: domain.x, range: [x0, x1] });
    const result = timeTicks(
      domain.x[0],
      domain.x[1],
      Math.max(2, Math.round(plotWidth / 90)),
    );
    x = { map: (value) => time.map(value), invert: time.invert };
    xTicks = result.values;
    const timeOfDay = timeTickFormat(result.interval, locale);
    const subDayTicks =
      result.interval === "hour" ||
      result.interval === "minute" ||
      result.interval === "second";
    if (subDayTicks && domain.x[1] - domain.x[0] > DAY) {
      // Hourly ticks across several days would all read "12 AM". Show the
      // date wherever a tick lands on midnight.
      const date = timeTickFormat("day", locale);
      xFormat = (value) => {
        const at = new Date(value);
        const midnight =
          at.getHours() === 0 && at.getMinutes() === 0 && at.getSeconds() === 0;
        return midnight ? date(value) : timeOfDay(value);
      };
    } else {
      xFormat = timeOfDay;
    }
    const subDay = domain.x[1] - domain.x[0] < DAY * 2;
    const full = getDateTimeFormatter(
      locale,
      subDay
        ? { dateStyle: "medium", timeStyle: "short" }
        : { dateStyle: "medium" },
    );
    xLabel = (value) => full.format(value);
  } else {
    const linear = scaleLinear({ domain: domain.x, range: [x0, x1] });
    x = { map: (value) => linear.map(Number(value)), invert: linear.invert };
    xTicks = ticks(
      domain.x[0],
      domain.x[1],
      Math.max(2, Math.round(plotWidth / 90)),
    );
    xFormat = (value) => formatCompact(value, { locale });
    xLabel = xFormat;
  }

  if (options.xFormat) xFormat = options.xFormat;
  if (options.xLabelFormat) xLabel = options.xLabelFormat;

  return {
    x,
    y: { map: y.map, invert: y.invert },
    xTicks,
    yTicks,
    xFormat,
    yFormat,
    xLabel,
    step,
    margin: { top, right, bottom, left },
    plot: { x0, x1, y0: top, y1: size.height - bottom },
  };
}

/**
 * Which tick labels to show so neighbors do not collide. Label width is
 * estimated from its text, so nothing is measured. Keeps every `n`th label,
 * always including the first.
 *
 * @param {ReadonlyArray<number>} positions Pixel position of each tick.
 * @param {ReadonlyArray<string>} labels
 * @param {number} [gap] Minimum space between labels, in pixels.
 * @returns {boolean[]}
 */
export function thinLabels(positions, labels, gap = 8) {
  const n = positions.length;
  if (n < 2) return new Array(n).fill(true);
  let widest = 0;
  for (const label of labels) widest = Math.max(widest, label.length);
  const spacing = Math.abs(positions[n - 1] - positions[0]) / (n - 1);
  const every =
    spacing > 0
      ? Math.max(1, Math.ceil((widest * GLYPH_WIDTH + gap) / spacing))
      : n;
  return positions.map((_, index) => index % every === 0);
}
