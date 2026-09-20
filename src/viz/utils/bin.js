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
  const sorted = sortedFinite(values);
  const n = sorted.length;
  if (n === 0) return [];

  let lo = domain ? Math.min(domain[0], domain[1]) : sorted[0];
  let hi = domain ? Math.max(domain[0], domain[1]) : sorted[n - 1];
  if (lo === hi) {
    return [
      { x0: lo, x1: hi, count: domain ? countWithin(sorted, lo, hi) : n },
    ];
  }

  let count;
  if (typeof bins === "number") {
    count = Math.max(1, Math.floor(bins));
  } else if (bins === "freedman-diaconis") {
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
    const value = sorted[i];
    if (value < lo || value > hi) continue;
    const index = Math.min(count - 1, Math.floor((value - lo) / width));
    out[index].count += 1;
  }
  return out;
}

/**
 * @param {ReadonlyArray<number>} sorted
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
function countWithin(sorted, lo, hi) {
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= lo && sorted[i] <= hi) count += 1;
  }
  return count;
}
