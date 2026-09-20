// @ts-check
// Histogram binning.
import { quantile, sortedFinite } from "./quantiles.js";
import { niceDomain, tickStep } from "./ticks.js";

/** @typedef {import("./bin.d.ts").Bin} Bin */
/** @typedef {import("./bin.d.ts").BinOptions} BinOptions */

/**
 * Count finite `values` into equal-width bins. Every bin is half-open
 * `[x0, x1)` except the last, which also includes its upper edge. Values
 * outside an explicit `domain` are dropped. A single distinct value yields
 * one bin.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @param {BinOptions} [options]
 * @returns {Bin[]}
 */
export function bin(values, options = {}) {
  const { bins = "sturges", domain, nice = true } = options;
  // One pass for the finite values and their extent. Sorting a million
  // values costs far more than binning them, so only the rule that needs
  // quartiles pays for it.
  /** @type {number[]} */
  const finite = [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    finite.push(value);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const n = finite.length;
  if (n === 0) return [];

  let lo = domain ? Math.min(domain[0], domain[1]) : min;
  let hi = domain ? Math.max(domain[0], domain[1]) : max;
  if (lo === hi) {
    return [
      { x0: lo, x1: hi, count: domain ? countWithin(finite, lo, hi) : n },
    ];
  }

  let count;
  if (typeof bins === "number") {
    count = Math.max(1, Math.floor(bins));
  } else if (bins === "freedman-diaconis") {
    const sorted = sortedFinite(finite);
    const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
    const width = (2 * iqr) / Math.cbrt(n);
    count =
      width > 0 ? Math.ceil((hi - lo) / width) : Math.ceil(Math.log2(n)) + 1;
  } else {
    count = Math.ceil(Math.log2(n)) + 1;
  }
  count = Math.min(count, 1000);

  let width = (hi - lo) / count;
  if (nice) {
    [lo, hi] = niceDomain(lo, hi, count);
    const step = tickStep(lo, hi, count);
    if (step > 0) {
      width = step;
      count = Math.max(1, Math.round((hi - lo) / step));
    }
  }

  /** @type {Bin[]} */
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    // Derive edges by index so they do not drift.
    out[i] = {
      x0: lo + i * width,
      x1: i === count - 1 ? hi : lo + (i + 1) * width,
      count: 0,
    };
  }
  for (let i = 0; i < n; i++) {
    const value = finite[i];
    if (value < lo || value > hi) continue;
    const index = Math.min(count - 1, Math.floor((value - lo) / width));
    out[index].count += 1;
  }
  return out;
}

/**
 * @param {ReadonlyArray<number>} finite
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
function countWithin(finite, lo, hi) {
  let count = 0;
  for (let i = 0; i < finite.length; i++) {
    if (finite[i] >= lo && finite[i] <= hi) count += 1;
  }
  return count;
}
