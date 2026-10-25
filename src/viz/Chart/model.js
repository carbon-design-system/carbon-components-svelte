// @ts-check
// Pure data model for `Chart`: rows to series groups, extents to scales.
// Kept DOM-free so the staging rules can be tested without rendering.

import {
  getDateTimeFormatter,
  getNumberFormatter,
} from "../../utils/intl-formatter-cache.js";
import { groupBy } from "../utils/accessor.js";
import { formatCompact, resolveFormat } from "../utils/format-compact.js";
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
 * Group rows into series and measure each series' extent in one pass. A
 * string `x` makes the axis categorical: `xs` then holds indexes into
 * `categories`, in first-seen order. Under `band`, a numeric or time x
 * becomes categories too, one per distinct value, as bars need.
 *
 * This is the stage that reads every row. It depends on the data and the
 * accessors only, so a zoom, a legend toggle, or a color change never comes
 * back here; `decorateGroups` layers those on at the cost of the series
 * count.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./model.d.ts").GroupRowsOptions<T>} options
 * @returns {import("./model.d.ts").GroupedRows<T>}
 */
export function groupRows(
  rows,
  { x, y, series, key: keyOf, band = false, locale, ghosts = {} },
) {
  const grouped = groupBy(rows, series);
  /** @type {string[]} */
  const categories = [];
  /** @type {Map<string, number>} */
  const categoryIndex = new Map();
  /** @type {"time" | "linear" | "category"} */
  let kind = "linear";

  /** @type {import("./model.d.ts").GroupedSeries<T>[]} */
  const groups = [];
  for (const [key, groupRows] of grouped) {
    const n = groupRows.length;
    /** @type {number[]} */
    const xs = new Array(n);
    /** @type {number[]} */
    const ys = new Array(n);
    // What identifies a row within its series: the `key` accessor, else the
    // x as given. Repeats within a series get a suffix, so an `{#each}` can
    // key on it; the suffix is in first-seen order, so it is as stable as
    // an index for rows that share an x.
    /** @type {Array<string | number>} */
    const keys = new Array(n);
    /** @type {Map<string, number>} */
    const seen = new Map();
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (let j = 0; j < n; j++) {
      const xv = x(groupRows[j], j);
      const raw = keyOf
        ? keyOf(groupRows[j], j)
        : xv instanceof Date
          ? xv.getTime()
          : typeof xv === "string"
            ? xv
            : Number(xv);
      const repeat = seen.get(String(raw)) ?? 0;
      seen.set(String(raw), repeat + 1);
      keys[j] = repeat === 0 ? raw : `${raw}#${repeat + 1}`;
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
      if (xs[j] < xMin) xMin = xs[j];
      if (xs[j] > xMax) xMax = xs[j];
      if (!Number.isFinite(ys[j])) continue;
      if (ys[j] < yMin) yMin = ys[j];
      if (ys[j] > yMax) yMax = ys[j];
    }
    const ghostOf = ghosts[/** @type {string} */ (key)];
    groups.push({
      key,
      rows: groupRows,
      xs,
      ys,
      keys,
      xExtent: xMin <= xMax ? [xMin, xMax] : null,
      yExtent: yMin <= yMax ? [yMin, yMax] : null,
      ...(ghostOf === undefined ? {} : { ghost: ghostOf }),
    });
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
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      for (let j = 0; j < group.xs.length; j++) {
        const index = slot.get(group.xs[j]) ?? Number.NaN;
        group.xs[j] = index;
        if (index < lo) lo = index;
        if (index > hi) hi = index;
      }
      group.xExtent = lo <= hi ? [lo, hi] : null;
    }
    kind = "category";
  }

  return { groups, kind, categories };
}

/**
 * Give grouped series their colors, hidden flags, and axes, and combine the
 * extents of the series that show. Costs the series count, not the rows:
 * the arrays from `groupRows` are shared, not copied.
 *
 * @template T
 * @param {import("./model.d.ts").GroupedRows<T>} grouped
 * @param {import("./model.d.ts").DecorateGroupsOptions} options
 * @returns {import("./model.d.ts").BuiltGroups<T>}
 */
export function decorateGroups(
  grouped,
  { hidden = [], secondary = [], colors, palette = 1 },
) {
  // A ghost takes its base series' color, so it does not count for the palette.
  const ghostCount = grouped.groups.filter(
    (group) => group.ghost !== undefined,
  ).length;
  const defaults = categoricalColors(
    grouped.groups.length - ghostCount,
    palette,
  );

  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  let y2Min = Number.POSITIVE_INFINITY;
  let y2Max = Number.NEGATIVE_INFINITY;

  /** @type {import("./model.d.ts").ChartGroup<T>[]} */
  const groups = [];
  let i = 0;
  for (const base of grouped.groups) {
    const override = colors?.[/** @type {string} */ (base.key)];
    const color =
      base.ghost === undefined
        ? ((override === undefined ? undefined : vizColor(override)) ??
          defaults[i] ??
          /** @type {string} */ (vizColor(i + 1)))
        : "";
    if (base.ghost === undefined) i++;
    groups.push({
      key: base.key,
      rows: base.rows,
      xs: base.xs,
      ys: base.ys,
      keys: base.keys,
      color,
      hidden: hidden.includes(base.key),
      axis: secondary.includes(base.key) ? "y2" : "y",
      ...(base.ghost === undefined ? {} : { ghost: base.ghost }),
    });
  }
  // Ghosts resolve after every base series has its color.
  for (const group of groups) {
    if (group.ghost === undefined) continue;
    const base = groups.find((candidate) => candidate.key === group.ghost);
    group.color = base?.color ?? /** @type {string} */ (vizColor("neutral"));
    if (base?.hidden) group.hidden = true;
  }
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    if (group.hidden) continue;
    const { xExtent, yExtent } = grouped.groups[g];
    if (xExtent) {
      if (xExtent[0] < xMin) xMin = xExtent[0];
      if (xExtent[1] > xMax) xMax = xExtent[1];
    }
    if (!yExtent) continue;
    if (group.axis === "y2") {
      if (yExtent[0] < y2Min) y2Min = yExtent[0];
      if (yExtent[1] > y2Max) y2Max = yExtent[1];
    } else {
      if (yExtent[0] < yMin) yMin = yExtent[0];
      if (yExtent[1] > yMax) yMax = yExtent[1];
    }
  }

  return {
    groups,
    kind: grouped.kind,
    categories: grouped.categories,
    xExtent: xMin <= xMax ? [xMin, xMax] : null,
    yExtent: yMin <= yMax ? [yMin, yMax] : null,
    y2Extent: y2Min <= y2Max ? [y2Min, y2Max] : null,
  };
}

/**
 * Both stages in one call, for a caller that has no reason to keep them
 * apart, such as a geometry test.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./model.d.ts").BuildGroupsOptions<T>} options
 * @returns {import("./model.d.ts").BuiltGroups<T>}
 */
export function buildGroups(rows, options) {
  return decorateGroups(groupRows(rows, options), options);
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
 * The index range a category axis shows: every category, or the part of
 * them a zoom asked for, kept inside what exists.
 *
 * @param {number} count
 * @param {unknown} xDomain
 * @returns {[number, number]}
 */
function categoryRange(count, xDomain) {
  const last = Math.max(0, count - 1);
  if (!Array.isArray(xDomain)) return [0, last];
  const a = Math.max(0, Math.min(last, Number(xDomain[0])));
  const b = Math.max(a, Math.min(last, Number(xDomain[1])));
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : [0, last];
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
      ? categoryRange(built.categories.length, xDomain)
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
  // Ticks are compact; a value the reader came for, in a tooltip or the
  // table, keeps its digits unless a format was given for both.
  const full = getNumberFormatter(locale, { maximumFractionDigits: 2 });
  const fullNumber = (/** @type {number} */ value) => full.format(value);
  const yValue = options.yFormat ? yFormat : fullNumber;
  const y2Value = options.y2Format ? y2Format : fullNumber;
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
      // Equal slots across the index range, each category at the center of
      // its own. The range is every category unless zoomed to some of them,
      // so a bar mark can use the same scale: `x.map(i)` is the slot center
      // and `step` its width.
      const [a, b] = domain.x;
      const last = domain.categories.length - 1;
      const slots = Math.max(b - a + 1, 1);
      const slot = (range[1] - range[0]) / slots;
      x = {
        map: (index) => range[0] + (Number(index) - a + 0.5) * slot,
        invert: (px) => {
          if (last < 0 || slot === 0) return 0;
          return Math.min(
            last,
            Math.max(0, Math.round(a + (px - range[0]) / slot - 0.5)),
          );
        },
      };
      xTicks = [];
      for (let index = Math.ceil(a); index <= Math.floor(b); index++) {
        if (index >= 0 && index <= last) xTicks.push(index);
      }
      xFormat = (index) => domain.categories[Math.round(index)] ?? "";
      xLabel = xFormat;
      step = slot;
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
    yValue,
    y2Value,
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
