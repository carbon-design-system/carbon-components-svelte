// @ts-check
// Quantiles and box plot statistics.

/** @typedef {import("./quantiles.d.ts").BoxStats} BoxStats */

/**
 * Quantile `p` in `[0, 1]` of an ascending array, by linear interpolation
 * (R type 7, the default in R, NumPy, and Excel). `NaN` for empty input.
 *
 * @param {ReadonlyArray<number>} sorted
 * @param {number} p
 * @returns {number}
 */
export function quantile(sorted, p) {
  const n = sorted.length;
  if (n === 0) return Number.NaN;
  if (p <= 0 || n === 1) return sorted[0];
  if (p >= 1) return sorted[n - 1];
  const position = (n - 1) * p;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[lower + 1] - sorted[lower]) * fraction;
}

/**
 * Finite entries of `values`, ascending, as a new array.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @returns {number[]}
 */
export function sortedFinite(values) {
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value === "number" && Number.isFinite(value)) out.push(value);
  }
  return out.sort((a, b) => a - b);
}

/**
 * Five-number summary with Tukey whiskers: the furthest points within
 * 1.5 × IQR of the box. Points beyond them are `outliers`. `null` when
 * nothing is finite.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @returns {BoxStats | null}
 */
export function boxStats(values) {
  const sorted = sortedFinite(values);
  const count = sorted.length;
  if (count === 0) return null;

  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const fence = (q3 - q1) * 1.5;
  const lowFence = q1 - fence;
  const highFence = q3 + fence;

  let whiskerLow = sorted[0];
  let whiskerHigh = sorted[count - 1];
  let sum = 0;
  /** @type {number[]} */
  const outliers = [];
  let foundLow = false;
  for (let i = 0; i < count; i++) {
    const value = sorted[i];
    sum += value;
    if (value < lowFence || value > highFence) {
      outliers.push(value);
      continue;
    }
    if (!foundLow) {
      whiskerLow = value;
      foundLow = true;
    }
    whiskerHigh = value;
  }

  return {
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[count - 1],
    whiskerLow,
    whiskerHigh,
    outliers,
    mean: sum / count,
    count,
  };
}
