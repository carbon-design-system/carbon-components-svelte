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

/**
 * Replace missing and non-finite entries with `null`. Positions are kept, so
 * a missing sample stays a gap at its own slot.
 */
export function normalizeSparklineValues(
  values: ReadonlyArray<number | null | undefined>,
): Array<number | null>;

/**
 * The value range to plot `values` against: the data extent, with `min`/`max`
 * overrides applied, optionally widened to include `0`. A zero-width extent
 * is expanded symmetrically by `1`.
 */
export function getSparklineDomain(
  values: ReadonlyArray<number | null>,
  options?: { min?: number; max?: number; includeZero?: boolean },
): SparklineDomain;

/**
 * Plot `values` as points inside a `width` x `height` viewBox. A `null` value
 * yields a `null` point at the same index.
 */
export function getSparklinePoints(
  values: ReadonlyArray<number | null>,
  options: {
    width: number;
    height: number;
    padding?: number;
    min?: number;
    max?: number;
  },
): Array<SparklinePoint | null>;

/**
 * An SVG path `d` for a polyline through `points`. A `null` point is a gap,
 * and a lone point becomes a zero-length segment that round caps paint as a dot.
 */
export function toLinePath(
  points: ReadonlyArray<SparklinePoint | null>,
): string;

/** An SVG path `d` for the filled area under `points`, closed down to `baselineY`. */
export function toAreaPath(
  points: ReadonlyArray<SparklinePoint | null>,
  baselineY: number,
): string;

/**
 * Plot `values` as bars inside a `width` x `height` viewBox. The gap shrinks
 * before the bars do, so a long series never overflows `width`. A `null`
 * value yields a `null` bar.
 */
export function getSparklineBars(
  values: ReadonlyArray<number | null>,
  options: {
    width: number;
    height: number;
    gap?: number;
    min?: number;
    max?: number;
  },
): Array<SparklineBar | null>;
