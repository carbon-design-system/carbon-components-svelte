/** A plotted point in SVG user units. */
export type SparklinePoint = { x: number; y: number };

/** A single bar's geometry in SVG user units. */
export type SparklineBar = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** The value range a series is plotted against. */
export type SparklineDomain = { min: number; max: number };

/** Drop non-finite entries (`NaN`, `Infinity`). */
export function normalizeSparklineValues(values: readonly number[]): number[];

/**
 * The value range to plot `values` against: the data extent, with `min`/`max`
 * overrides applied, optionally widened to include `0`. A zero-width extent
 * is expanded symmetrically by `1`.
 */
export function getSparklineDomain(
  values: readonly number[],
  options?: { min?: number; max?: number; includeZero?: boolean },
): SparklineDomain;

/** Plot `values` as points inside a `width` x `height` viewBox. */
export function getSparklinePoints(
  values: readonly number[],
  options: {
    width: number;
    height: number;
    padding?: number;
    min?: number;
    max?: number;
  },
): SparklinePoint[];

/** An SVG path `d` for a polyline through `points`, or `""` for fewer than two. */
export function toLinePath(points: readonly SparklinePoint[]): string;

/** An SVG path `d` for the filled area under `points`, closed down to `baselineY`. */
export function toAreaPath(
  points: readonly SparklinePoint[],
  baselineY: number,
): string;

/** Plot `values` as bars inside a `width` x `height` viewBox. */
export function getSparklineBars(
  values: readonly number[],
  options: {
    width: number;
    height: number;
    gap?: number;
    min?: number;
    max?: number;
  },
): SparklineBar[];
