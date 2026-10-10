/**
 * Pure data model for `Chart`: rows to series groups, extents to scales.
 */
import type { NumberFormat } from "../utils/format-compact.js";
import type { VizColor } from "../utils/tokens.js";

export type ChartSeriesKey = string | number;

export type ChartMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ChartSize = { width: number; height: number };

export type ChartGroup<T> = {
  key: ChartSeriesKey;
  /** The group's rows, in input order. */
  rows: T[];
  /** x per row: epoch ms, a number, or an index into the categories. */
  xs: number[];
  /** y per row. Non-finite for a missing value. */
  ys: number[];
  /** Resolved CSS color, usually a `var(--cds-viz-*)` reference. */
  color: string;
  hidden: boolean;
  /** Which y scale the series is plotted on. Defaults to the first. */
  axis?: "y" | "y2";
};

export type ChartXKind = "time" | "linear" | "category";

export type BuiltGroups<T> = {
  groups: ChartGroup<T>[];
  kind: ChartXKind;
  categories: string[];
  /** Extent over visible series. `null` when there is nothing to plot. */
  xExtent: [number, number] | null;
  yExtent: [number, number] | null;
  /** Extent over the visible series on the secondary axis. */
  y2Extent: [number, number] | null;
};

export type BuildGroupsOptions<T> = {
  x: (row: T, index: number) => number | Date | string;
  y: (row: T, index: number) => number | null | undefined;
  series: (row: T, index: number) => ChartSeriesKey;
  hidden?: ReadonlyArray<ChartSeriesKey>;
  /** Series plotted on a secondary y axis, with its own domain. */
  secondary?: ReadonlyArray<ChartSeriesKey>;
  /** Fixed color per series key. */
  colors?: Record<string, VizColor>;
  /** Which of Carbon's prescribed color groups to use, 1-based. */
  palette?: number;
  /**
   * Give every distinct x its own slot, as bars need. A numeric or time x
   * becomes categories in ascending order.
   */
  band?: boolean;
  /** Used to label time and number categories in band mode. */
  locale?: string;
};

export type ChartDomain = {
  x: [number, number];
  y: [number, number];
  /** Domain of the secondary y axis, or `null` without one. */
  y2: [number, number] | null;
  /** `"log"` only when it was asked for and the data is strictly positive. */
  yScale?: "linear" | "log";
  kind: ChartXKind;
  categories: string[];
};

export type ResolveDomainOptions = {
  /**
   * Fixed bounds, or `"nice"` to round a numeric x out to tick values. On a
   * category axis, bounds are category indexes, as a zoom sets them.
   */
  xDomain?: readonly [number | Date, number | Date] | "nice";
  /**
   * Fixed bounds, `"auto"` for the data's extent, `"nice"` to round it out,
   * or `"marks"` to measure only what marks register, as a waterfall wants.
   */
  yDomain?: readonly [number, number] | "auto" | "nice" | "marks";
  y2Domain?: readonly [number, number] | "auto" | "nice";
  /** @default "linear" */
  yScale?: "linear" | "log";
  /** Include zero in the y domains. @default true */
  zero?: boolean;
  /** Extra y values marks asked to keep in view. */
  include?: ReadonlyArray<number>;
};

export type BuildScalesOptions = {
  locale?: string;
  margin?: Partial<ChartMargins>;
  /** Extra space marks asked for, added to the default margins. */
  reserved?: ReadonlyArray<{ side: keyof ChartMargins; px: number }>;
  yFormat?: NumberFormat;
  xFormat?: (value: number) => string;
  xLabelFormat?: (value: number) => string;
  y2Format?: NumberFormat;
  /** @default "vertical" */
  orientation?: "vertical" | "horizontal";
};

export type ChartScales = {
  x: { map(value: number | Date): number; invert(px: number): number };
  y: { map(value: number): number; invert(px: number): number };
  xTicks: number[];
  yTicks: number[];
  /** Tick label formatters. */
  xFormat(value: number): string;
  yFormat(value: number): string;
  /** Full-precision x label, for tooltips and announcements. */
  xLabel(value: number): string;
  /**
   * Width of one category slot. `x.map(index)` is the slot's center.
   * `undefined` on a time or linear axis.
   */
  step: number | undefined;
  /** How the x values in each group should be read. */
  kind: ChartXKind;
  /** Labels for a categorical x, indexed by a group's `xs`. */
  categories: ReadonlyArray<string>;
  /** The secondary y scale, or `null` when no series is plotted on one. */
  y2: { map(value: number): number; invert(px: number): number } | null;
  /** Secondary tick values, at the same positions as `yTicks`. */
  y2Ticks: number[];
  y2Format(value: number): string;
  /**
   * Whether the x scale maps onto vertical pixels and the y scale onto
   * horizontal ones, as for horizontal bars.
   */
  horizontal: boolean;
  margin: ChartMargins;
  plot: { x0: number; x1: number; y0: number; y1: number };
};

/** Average glyph width of 12px IBM Plex Sans. */
export const GLYPH_WIDTH: number;

/**
 * Group rows into series and measure their extents. A string `x` makes the
 * axis categorical: `xs` then holds indexes into `categories`.
 */
export function buildGroups<T>(
  rows: ReadonlyArray<T>,
  options: BuildGroupsOptions<T>,
): BuiltGroups<T>;

/** Resolve the domain to plot from measured extents and the chart's options. */
export function resolveDomain(
  built: BuiltGroups<unknown>,
  options: ResolveDomainOptions,
): ChartDomain;

/** Whether two domains plot identically. */
export function sameDomain(a: ChartDomain | null, b: ChartDomain): boolean;

/**
 * Scales, ticks, formatters, and the plot box for a domain at a size. The
 * left margin is estimated from the formatted y tick labels.
 */
export function buildScales(
  domain: ChartDomain,
  size: ChartSize,
  options?: BuildScalesOptions,
): ChartScales;

/**
 * Which tick labels to show so neighbors do not collide. Label width is
 * estimated from its text, so nothing is measured. Keeps every `n`th label,
 * always including the first.
 */
export function thinLabels(
  positions: ReadonlyArray<number>,
  labels: ReadonlyArray<string>,
  gap?: number,
): boolean[];

/**
 * The y scale a group is plotted on: the secondary one for a series the
 * chart was told to put there, when it has one.
 */
export function yScaleOf(
  scales: ChartScales,
  group: { axis?: "y" | "y2" },
): ChartScales["y"];

/** The groups a mark draws: all of them, or only the series it was given. */
export function pickGroups<G extends { key: ChartSeriesKey }>(
  groups: ReadonlyArray<G>,
  keys: ReadonlyArray<ChartSeriesKey> | undefined,
): ReadonlyArray<G>;
