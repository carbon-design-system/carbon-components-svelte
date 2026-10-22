/**
 * Quantiles and box plot statistics.
 */

export type BoxStats = {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** Furthest point within 1.5 × IQR below the box. */
  whiskerLow: number;
  /** Furthest point within 1.5 × IQR above the box. */
  whiskerHigh: number;
  /** Points beyond the whiskers, ascending. */
  outliers: number[];
  mean: number;
  /** Number of finite values. */
  count: number;
};

/**
 * Quantile `p` in `[0, 1]` of an ascending array, by linear interpolation
 * (R type 7, the default in R, NumPy, and Excel). `NaN` for empty input.
 */
export function quantile(sorted: ReadonlyArray<number>, p: number): number;

/** Finite entries of `values`, ascending, as a new array. */
export function sortedFinite(
  values: ReadonlyArray<number | null | undefined>,
): number[];

/**
 * Five-number summary with Tukey whiskers: the furthest points within
 * 1.5 × IQR of the box. Points beyond them are `outliers`. `null` when
 * nothing is finite.
 */
export function boxStats(
  values: ReadonlyArray<number | null | undefined>,
): BoxStats | null;
