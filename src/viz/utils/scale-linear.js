// @ts-check
// Continuous scale: maps a numeric domain onto a pixel range and back.
import { niceDomain } from "./ticks.js";

/** @typedef {import("./scale-linear.d.ts").LinearScale} LinearScale */
/** @typedef {import("./scale-linear.d.ts").LinearScaleOptions} LinearScaleOptions */

/**
 * Give a zero-width domain some span instead of dividing by zero. A non-zero
 * value lands mid-range. A flat zero becomes `[0, 1]`, so an all-zero series
 * sits on the baseline rather than floating in the middle of the plot.
 *
 * @param {number} d0
 * @param {number} d1
 * @returns {[number, number]}
 */
export function expandFlatDomain(d0, d1) {
  if (d0 !== d1) return [d0, d1];
  return d0 === 0 ? [0, 1] : [d0 - Math.abs(d0) * 0.5, d0 + Math.abs(d0) * 0.5];
}

/**
 * Build `map`/`invert` for a domain already in linear space. `forward` and
 * `backward` convert between data and linear space, which is how the log
 * scale reuses this.
 *
 * @param {readonly [number, number]} domain
 * @param {readonly [number, number]} range
 * @param {boolean} clamp
 * @param {(value: number) => number} [forward]
 * @param {(value: number) => number} [backward]
 * @returns {{ map: (value: number) => number, invert: (px: number) => number }}
 */
export function createInterpolator(domain, range, clamp, forward, backward) {
  const d0 = forward ? forward(domain[0]) : domain[0];
  const d1 = forward ? forward(domain[1]) : domain[1];
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;
  const rangeMin = Math.min(r0, r1);
  const rangeMax = Math.max(r0, r1);
  const domainMin = Math.min(d0, d1);
  const domainMax = Math.max(d0, d1);

  return {
    map(value) {
      const linear = forward ? forward(value) : value;
      const px = r0 + ((linear - d0) / domainSpan) * rangeSpan;
      return clamp ? Math.min(rangeMax, Math.max(rangeMin, px)) : px;
    },
    invert(px) {
      if (rangeSpan === 0) return domain[0];
      let linear = d0 + ((px - r0) / rangeSpan) * domainSpan;
      if (clamp) linear = Math.min(domainMax, Math.max(domainMin, linear));
      return backward ? backward(linear) : linear;
    },
  };
}

/**
 * Linear scale. Reversed ranges (SVG `y`: `[height, 0]`) and reversed
 * domains work. A zero-width domain is widened so it never yields `NaN`.
 *
 * @param {LinearScaleOptions} options
 * @returns {LinearScale}
 */
export function scaleLinear({ domain, range, clamp = false, nice = false }) {
  let [d0, d1] = expandFlatDomain(domain[0], domain[1]);
  if (nice) {
    [d0, d1] = niceDomain(d0, d1, nice === true ? 5 : nice);
  }
  /** @type {[number, number]} */
  const resolved = [d0, d1];
  const { map, invert } = createInterpolator(resolved, range, clamp);
  return { domain: resolved, range, clamp, map, invert };
}
