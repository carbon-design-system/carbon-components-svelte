/**
 * Stack long-format rows into layers: long in, long out.
 */

export type StackOffset = "none" | "normalize" | "diverging" | "stream";

export type StackOptions<T, K, S> = {
  x: (row: T, index: number) => K;
  y: (row: T, index: number) => number | null | undefined;
  series: (row: T, index: number) => S;
  /** @default "none" */
  offset?: StackOffset;
  /** Bottom-to-top series order. Defaults to first-seen order. */
  order?: ReadonlyArray<S>;
};

export type StackedRow<T, K, S> = {
  datum: T;
  series: S;
  x: K;
  /** The row's own value. Missing or non-finite values count as `0`. */
  value: number;
  y0: number;
  y1: number;
};

/**
 * Compute `[y0, y1]` for each row by stacking series at the same `x`. Rows
 * come back in input order, each wrapping its original `datum`. Dates are
 * matched by time, not identity. A missing `(x, series)` cell simply adds
 * nothing to that column.
 *
 * - `"none"`: stack up from zero.
 * - `"diverging"`: positives stack up from zero, negatives stack down.
 * - `"normalize"`: each `x` sums to 1. Shares have no meaning for negative
 *   values, so they count as zero. An all-zero column stays at zero.
 * - `"stream"`: each column is centered on zero.
 */
export function stack<T, K, S>(
  rows: ReadonlyArray<T>,
  options: StackOptions<T, K, S>,
): Array<StackedRow<T, K, S>>;
