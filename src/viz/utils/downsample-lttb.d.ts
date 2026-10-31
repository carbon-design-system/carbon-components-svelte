/**
 * Largest-Triangle-Three-Buckets downsampling: keeps the visual shape of a
 * long series (peaks, dips, spikes) in far fewer points.
 */

/**
 * Reduce `rows` to about `threshold` rows. Returns the original row objects,
 * so hover and select still report real data. The first and last rows are
 * always kept. When `threshold` is at least `rows.length` (or below 3) the
 * input array itself is returned, so callers can skip work by identity.
 * Rows with a non-finite `y` never win a bucket unless the whole bucket is
 * missing, and never skew a bucket average. `rows` must ascend by `x`.
 */
export function lttb<T>(
  rows: ReadonlyArray<T>,
  threshold: number,
  x: (row: T, index: number) => number,
  y: (row: T, index: number) => number,
): ReadonlyArray<T>;
