// @ts-check
// Flag outliers in a series by how many standard deviations they sit from
// the mean, so a chart can mark them with a shape rather than by color alone.

/**
 * `true` at each index whose value lies more than `threshold` standard
 * deviations from the mean. With a `window`, the mean and deviation are
 * those of the values before the point, up to `window` of them, so a level
 * shift is flagged when it happens rather than after it has moved the mean.
 * Missing values are never flagged and never counted. A flat series flags
 * nothing.
 *
 * One pass over the values, with running sums for the window.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @param {{ threshold?: number; window?: number }} [options]
 * @returns {boolean[]}
 */
export function flagAnomalies(values, { threshold = 3, window } = {}) {
  const n = values.length;
  const flags = new Array(n).fill(false);
  if (window === undefined) {
    let count = 0;
    let sum = 0;
    let squares = 0;
    for (let i = 0; i < n; i++) {
      const value = values[i];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      count++;
      sum += value;
      squares += value * value;
    }
    if (count < 2) return flags;
    const mean = sum / count;
    const deviation = Math.sqrt(Math.max(squares / count - mean * mean, 0));
    if (deviation === 0) return flags;
    for (let i = 0; i < n; i++) {
      const value = values[i];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      flags[i] = Math.abs(value - mean) > threshold * deviation;
    }
    return flags;
  }

  // The window holds the last `window` finite values before the point.
  const size = Math.max(2, Math.floor(window));
  /** @type {number[]} */
  const recent = [];
  let head = 0;
  let sum = 0;
  let squares = 0;
  for (let i = 0; i < n; i++) {
    const value = values[i];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const count = recent.length - head;
    if (count >= 2) {
      const mean = sum / count;
      const deviation = Math.sqrt(Math.max(squares / count - mean * mean, 0));
      flags[i] =
        deviation > 0 && Math.abs(value - mean) > threshold * deviation;
    }
    recent.push(value);
    sum += value;
    squares += value * value;
    if (recent.length - head > size) {
      const gone = recent[head++];
      sum -= gone;
      squares -= gone * gone;
    }
    // Keep the array from growing without bound on a long series.
    if (head > 1024) {
      recent.splice(0, head);
      head = 0;
    }
  }
  return flags;
}
