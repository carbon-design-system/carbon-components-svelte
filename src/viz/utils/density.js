// @ts-check
// Kernel density estimate: the smooth shape of a sample, for violins and
// ridgelines.

import { quantile, sortedFinite } from "./quantiles.js";

/**
 * Silverman's rule of thumb: a bandwidth that suits most unimodal
 * samples, from the spread and the count.
 *
 * @param {ReadonlyArray<number>} sorted
 * @returns {number}
 */
export function silverman(sorted) {
  const n = sorted.length;
  if (n < 2) return 1;
  let sum = 0;
  for (const value of sorted) sum += value;
  const mean = sum / n;
  let squares = 0;
  for (const value of sorted) squares += (value - mean) ** 2;
  const sd = Math.sqrt(squares / (n - 1));
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
  const spread = Math.min(sd, iqr / 1.34) || sd || 1;
  return 0.9 * spread * n ** -0.2;
}

/**
 * The density of `values` at evenly spaced points across `domain`, with
 * a Gaussian kernel. Defaults to the sample's own range widened by three
 * bandwidths, so the curve tapers to nothing at both ends. The area under
 * the curve is one.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @param {import("./density.d.ts").DensityOptions} [options]
 * @returns {import("./density.d.ts").Density}
 */
export function kernelDensity(values, options = {}) {
  const { bandwidth, points = 64 } = options;
  const sorted = sortedFinite(values);
  const n = sorted.length;
  if (n === 0) return { points: [], bandwidth: 0, peak: 0, count: 0 };
  const h = bandwidth && bandwidth > 0 ? bandwidth : silverman(sorted);
  const [d0, d1] = options.domain ?? [sorted[0] - 3 * h, sorted[n - 1] + 3 * h];
  const steps = Math.max(points, 2);
  const step = (d1 - d0) / (steps - 1);
  const scale = 1 / (n * h * Math.sqrt(2 * Math.PI));
  /** @type {Array<{ x: number; y: number }>} */
  const out = new Array(steps);
  let peak = 0;
  for (let i = 0; i < steps; i++) {
    const x = d0 + i * step;
    let sum = 0;
    for (const value of sorted) {
      const z = (x - value) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    const y = sum * scale;
    if (y > peak) peak = y;
    out[i] = { x, y };
  }
  return { points: out, bandwidth: h, peak, count: n };
}
