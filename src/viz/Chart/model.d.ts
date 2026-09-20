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
};

export type ChartXKind = "time" | "linear" | "category";

export type BuiltGroups<T> = {
  groups: ChartGroup<T>[];
  kind: ChartXKind;
  categories: string[];
  /** Extent over visible series. `null` when there is nothing to plot. */
  xExtent: [number, number] | null;
  yExtent: [number, number] | null;
};

export type BuildGroupsOptions<T> = {
  x: (row: T, index: number) => number | Date | string;
  y: (row: T, index: number) => number | null | undefined;
  series: (row: T, index: number) => ChartSeriesKey;
  hidden?: ReadonlyArray<ChartSeriesKey>;
  /** Fixed color per series key. */
  colors?: Record<string, VizColor>;
  /** Which of Carbon's prescribed color groups to use, 1-based. */
  palette?: number;
};

export type ChartDomain = {
  x: [number, number];
  y: [number, number];
  kind: ChartXKind;
  categories: string[];
};

export type ResolveDomainOptions = {
  xDomain?: readonly [number | Date, number | Date];
  yDomain?: readonly [number, number] | "auto" | "nice";
  /** Include zero in the y domain. @default true */
  zero?: boolean;
  /** Extra y values marks asked to keep in view. */
  include?: ReadonlyArray<number>;
};

export type BuildScalesOptions = {
  locale?: string;
  margin?: Partial<ChartMargins>;
  yFormat?: NumberFormat;
  xFormat?: (value: number) => string;
  xLabelFormat?: (value: number) => string;
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
