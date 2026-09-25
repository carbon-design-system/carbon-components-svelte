// @ts-check
// Largest-Triangle-Three-Buckets downsampling: keeps the visual shape of a
// long series (peaks, dips, spikes) in far fewer points.

/**
 * Reduce `rows` to about `threshold` rows. Returns the original row objects,
 * so hover and select still report real data. The first and last rows are
 * always kept. When `threshold` is at least `rows.length` (or below 3) the
 * input array itself is returned, so callers can skip work by identity.
 * Rows with a non-finite `y` never win a bucket unless the whole bucket is
 * missing, and never skew a bucket average.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows Ascending by `x`.
 * @param {number} threshold
 * @param {(row: T, index: number) => number} x
 * @param {(row: T, index: number) => number} y
 * @returns {ReadonlyArray<T>}
 */
export function lttb(rows, threshold, x, y) {
  const n = rows.length;
  const target = Math.floor(threshold);
  if (target >= n || target < 3) return rows;

  /** @type {T[]} */
  const out = new Array(target);
  const bucketSize = (n - 2) / (target - 2);
  let selected = 0;
  out[0] = rows[0];

  for (let i = 0; i < target - 2; i++) {
    const start = Math.floor(i * bucketSize) + 1;
    const end = Math.min(n - 1, Math.floor((i + 1) * bucketSize) + 1);
    const nextEnd = Math.min(n, Math.floor((i + 2) * bucketSize) + 1);

    // Average of the next bucket is the third corner of each triangle.
    let avgX = 0;
    let avgY = 0;
    let avgCount = 0;
    for (let j = end; j < nextEnd; j++) {
      const py = y(rows[j], j);
      if (!Number.isFinite(py)) continue;
      avgX += x(rows[j], j);
      avgY += py;
      avgCount += 1;
    }
    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    } else {
      avgX = x(rows[Math.min(end, n - 1)], Math.min(end, n - 1));
      avgY = 0;
    }

    const ax = x(rows[selected], selected);
    const ayRaw = y(rows[selected], selected);
    const ay = Number.isFinite(ayRaw) ? ayRaw : avgY;

    let best = start;
    let bestArea = -1;
    for (let j = start; j < end; j++) {
      const py = y(rows[j], j);
      if (!Number.isFinite(py)) continue;
      const area = Math.abs(
        (ax - avgX) * (py - ay) - (ax - x(rows[j], j)) * (avgY - ay),
      );
      if (area > bestArea) {
        bestArea = area;
        best = j;
      }
    }
    out[i + 1] = rows[best];
    selected = best;
  }

  out[target - 1] = rows[n - 1];
  return out;
}
