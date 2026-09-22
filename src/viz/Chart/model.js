// @ts-check
// Pure data model for `Chart`: rows to series groups, extents to scales.
// Kept DOM-free so the staging rules can be tested without rendering.

import { getDateTimeFormatter } from "../../utils/intl-formatter-cache.js";
import { groupBy } from "../utils/accessor.js";
import { formatCompact, resolveFormat } from "../utils/format-compact.js";
import { scalePoint } from "../utils/scale-band.js";
import { scaleLinear } from "../utils/scale-linear.js";
import { logTicks, niceLogDomain, scaleLog } from "../utils/scale-log.js";
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
  {
    x,
    y,
    series,
    hidden = [],
    secondary = [],
    colors,
    palette = 1,
    band = false,
    locale,
  },
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
  let y2Min = Number.POSITIVE_INFINITY;
  let y2Max = Number.NEGATIVE_INFINITY;

  /** @type {import("./model.d.ts").ChartGroup<T>[]} */
  const groups = [];
  let i = 0;
  for (const [key, groupRows] of grouped) {
    const isHidden = hidden.includes(key);
    const onSecondary = secondary.includes(key);
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
      if (!Number.isFinite(ys[j])) continue;
      if (onSecondary) {
        if (ys[j] < y2Min) y2Min = ys[j];
        if (ys[j] > y2Max) y2Max = ys[j];
      } else {
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
      axis: onSecondary ? "y2" : "y",
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
    y2Extent: y2Min <= y2Max ? [y2Min, y2Max] : null,
  };
}

/**
 * The y scale a group is plotted on: the secondary one for a series the
 * chart was told to put there, when it has one.
 *
 * @param {ChartScales} scales
 * @param {{ axis?: "y" | "y2" }} group
 * @returns {ChartScales["y"]}
 */
export function yScaleOf(scales, group) {
  return group.axis === "y2" && scales.y2 ? scales.y2 : scales.y;
}

/**
 * The groups a mark draws: all of them, or only the series it was given.
 *
 * @template G
 * @param {ReadonlyArray<G & { key: string | number }>} groups
 * @param {ReadonlyArray<string | number> | undefined} keys
 * @returns {ReadonlyArray<G & { key: string | number }>}
 */
export function pickGroups(groups, keys) {
  return keys ? groups.filter((group) => keys.includes(group.key)) : groups;
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
  {
    xDomain,
    yDomain = "nice",
    y2Domain = "nice",
    yScale = "linear",
    zero = true,
    include = [],
  },
) {
  // "marks": the data's own extent means nothing, as in a waterfall, and
  // only what marks registered counts.
  let [y0, y1] =
    yDomain === "marks"
      ? [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
      : (built.yExtent ?? [0, 1]);
  for (const value of include) {
    if (!Number.isFinite(value)) continue;
    if (value < y0) y0 = value;
    if (value > y1) y1 = value;
  }
  // Zero has no logarithm, so a log axis over positive data never includes
  // it. Data that touches zero falls back to a linear axis.
  if (y0 > y1) {
    y0 = 0;
    y1 = 1;
  }
  const log = yScale === "log" && y0 > 0;
  if (zero && !log) {
    y0 = Math.min(0, y0);
    y1 = Math.max(0, y1);
  }
  /** @type {[number, number]} */
  let y = Array.isArray(yDomain) ? [yDomain[0], yDomain[1]] : [y0, y1];
  if (yDomain === "nice" || yDomain === "marks") {
    y = log ? niceLogDomain(y[0], y[1]) : niceDomain(y[0], y[1], 5);
  }

  const measured = built.xExtent ?? [0, 1];
  /** @type {[number, number]} */
  const x =
    built.kind === "category"
      ? [0, Math.max(0, built.categories.length - 1)]
      : Array.isArray(xDomain)
        ? [Number(xDomain[0]), Number(xDomain[1])]
        : xDomain === "nice" && built.kind === "linear"
          ? niceDomain(measured[0], measured[1], 5)
          : [measured[0], measured[1]];

  /** @type {[number, number] | null} */
  let y2 = null;
  if (built.y2Extent) {
    let [a, b] = built.y2Extent;
    if (zero) {
      a = Math.min(0, a);
      b = Math.max(0, b);
    }
    y2 = Array.isArray(y2Domain) ? [y2Domain[0], y2Domain[1]] : [a, b];
    if (y2Domain === "nice") y2 = niceDomain(y2[0], y2[1], 5);
  }

  return {
    x,
    y,
    y2,
    yScale: log && y[0] > 0 ? "log" : "linear",
    kind: built.kind,
    categories: built.categories,
  };
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
  if ((a.yScale ?? "linear") !== (b.yScale ?? "linear")) return false;
  if (a.x[0] !== b.x[0] || a.x[1] !== b.x[1]) return false;
  if (a.y[0] !== b.y[0] || a.y[1] !== b.y[1]) return false;
  if ((a.y2 === null) !== (b.y2 === null)) return false;
  if (a.y2 && b.y2 && (a.y2[0] !== b.y2[0] || a.y2[1] !== b.y2[1])) {
    return false;
  }
  if (a.categories.length !== b.categories.length) return false;
  for (let i = 0; i < a.categories.length; i++) {
    if (a.categories[i] !== b.categories[i]) return false;
  }
  return true;
}

/**
 * Scales, ticks, formatters, and the plot box for a domain at a size. The
 * left margin is estimated from the labels that sit in it, so it needs no
 * DOM measurement and mount settles without an extra pass.
 *
 * With a horizontal orientation the x scale maps onto vertical pixels, top to
 * bottom, and the y scale onto horizontal pixels. `x` and `y` keep their
 * meaning (position and value); only the pixel axis each one drives swaps.
 *
 * @param {ChartDomain} domain
 * @param {ChartSize} size
 * @param {import("./model.d.ts").BuildScalesOptions} [options]
 * @returns {ChartScales}
 */
export function buildScales(domain, size, options = {}) {
  const { locale, margin: marginOverride = {}, reserved = [] } = options;
  const horizontal = options.orientation === "horizontal";
  const log = domain.yScale === "log" && domain.y[0] > 0;
  // Space marks asked for, such as an axis title, on top of the defaults.
  const extra = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const { side, px } of reserved) extra[side] += px;
  const y2Format = options.y2Format
    ? resolveFormat(options.y2Format, locale)
    : (/** @type {number} */ value) => formatCompact(value, { locale });
  // A secondary axis sits opposite the first: on the right, or along the top
  // of a horizontal chart. Its ticks share the first axis's count, so the
  // two line up on the same grid lines.
  const y2Guess = domain.y2 ? ticks(domain.y2[0], domain.y2[1], 5) : [];
  let y2Width = 0;
  for (const tick of y2Guess) {
    y2Width = Math.max(y2Width, y2Format(tick).length);
  }
  const top =
    marginOverride.top ?? 8 + extra.top + (domain.y2 && horizontal ? 20 : 0);
  const bottom = marginOverride.bottom ?? 28 + extra.bottom;
  const right =
    marginOverride.right ??
    (domain.y2 && !horizontal
      ? Math.round(y2Width * GLYPH_WIDTH * 1.15 + 14)
      : 16) + extra.right;

  const yFormat = options.yFormat
    ? resolveFormat(options.yFormat, locale)
    : (/** @type {number} */ value) => formatCompact(value, { locale });
  const plotHeight = Math.max(1, size.height - top - bottom);

  /**
   * The x scale over a pixel range, with its ticks and formatters.
   *
   * @param {[number, number]} range
   * @param {number} count Tick budget for a time or linear axis.
   */
  function buildX(range, count) {
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
        range,
        padding: 0.5,
      });
      const last = domain.categories.length - 1;
      x = {
        map: (index) =>
          point.map(domain.categories[Math.round(Number(index))]) ?? range[0],
        invert: (px) => {
          if (last < 0 || point.step === 0) return 0;
          const first = point.map(domain.categories[0]) ?? range[0];
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
      const time = scaleTime({ domain: domain.x, range });
      const result = timeTicks(domain.x[0], domain.x[1], count);
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
            at.getHours() === 0 &&
            at.getMinutes() === 0 &&
            at.getSeconds() === 0;
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
      const linear = scaleLinear({ domain: domain.x, range });
      x = { map: (value) => linear.map(Number(value)), invert: linear.invert };
      xTicks = ticks(domain.x[0], domain.x[1], count);
      xFormat = (value) => formatCompact(value, { locale });
      xLabel = xFormat;
    }

    if (options.xFormat) xFormat = options.xFormat;
    if (options.xLabelFormat) xLabel = options.xLabelFormat;
    return { x, xTicks, xFormat, xLabel, step };
  }

  /**
   * Left margin that fits the widest of `labels`, estimated from its text.
   * @param {ReadonlyArray<string>} labels
   * @param {number} [cap]
   */
  function leftFor(labels, cap = Number.POSITIVE_INFINITY) {
    let longest = 0;
    for (const label of labels) longest = Math.max(longest, label.length);
    return (
      marginOverride.left ??
      Math.min(cap, Math.round(longest * GLYPH_WIDTH * 1.15 + 14)) + extra.left
    );
  }

  /** @type {ReturnType<typeof buildX>} */
  let band;
  /** @type {number[]} */
  let yTicks;
  /** @type {number} */
  let left;

  if (horizontal) {
    // The x scale runs down the left side, so its labels set the margin.
    band = buildX(
      [top, size.height - bottom],
      Math.max(2, Math.round(plotHeight / 40)),
    );
    left = leftFor(
      band.xTicks.map((tick) => band.xFormat(tick)),
      Math.round(size.width * 0.4),
    );
    const plotWidth = Math.max(1, size.width - right - left);
    yTicks = log
      ? logTicks(domain.y[0], domain.y[1])
      : ticks(
          domain.y[0],
          domain.y[1],
          Math.max(2, Math.round(plotWidth / 90)),
        );
  } else {
    yTicks = log
      ? logTicks(domain.y[0], domain.y[1])
      : ticks(
          domain.y[0],
          domain.y[1],
          Math.max(2, Math.round(plotHeight / 56)),
        );
    left = leftFor(yTicks.map((tick) => yFormat(tick)));
    const plotWidth = Math.max(1, size.width - right - left);
    band = buildX(
      [left, Math.max(left + 1, size.width - right)],
      Math.max(2, Math.round(plotWidth / 90)),
    );
  }

  const x0 = left;
  const x1 = Math.max(left + 1, size.width - right);
  const y = (log ? scaleLog : scaleLinear)({
    domain: domain.y,
    range: horizontal ? [x0, x1] : [size.height - bottom, top],
  });

  // Spread the secondary ticks over the same positions as the first axis's,
  // so one set of grid lines serves both.
  /** @type {ChartScales["y2"]} */
  let y2 = null;
  /** @type {number[]} */
  let y2Ticks = [];
  if (domain.y2) {
    const secondary = scaleLinear({
      domain: domain.y2,
      range: horizontal ? [x0, x1] : [size.height - bottom, top],
    });
    y2 = { map: secondary.map, invert: secondary.invert };
    y2Ticks = yTicks.map((tick) => secondary.invert(y.map(tick)));
  }

  return {
    x: band.x,
    y: { map: y.map, invert: y.invert },
    y2,
    y2Ticks,
    y2Format,
    xTicks: band.xTicks,
    yTicks,
    xFormat: band.xFormat,
    yFormat,
    xLabel: band.xLabel,
    step: band.step,
    kind: domain.kind,
    categories: domain.categories,
    horizontal,
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
