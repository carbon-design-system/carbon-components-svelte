// @ts-check
// Logarithmic scale for data spanning orders of magnitude.
import { createInterpolator, scaleLinear } from "./scale-linear.js";

/** @typedef {import("./scale-log.d.ts").LogScale} LogScale */
/** @typedef {import("./scale-log.d.ts").LogScaleOptions} LogScaleOptions */

/**
 * Log scale. The domain must be strictly positive or strictly negative; a
 * domain touching or crossing zero has no logarithm, so it falls back to a
 * linear scale (`kind` reports which one was built).
 *
 * @param {LogScaleOptions} options
 * @returns {LogScale}
 */
export function scaleLog({ domain, range, base = 10, clamp = false }) {
  const [d0, d1] = domain;
  const valid =
    Number.isFinite(d0) && Number.isFinite(d1) && d0 * d1 > 0 && d0 !== d1;
  if (!valid) {
    return { ...scaleLinear({ domain, range, clamp }), base, kind: "linear" };
  }

  const sign = d0 < 0 ? -1 : 1;
  const logBase = Math.log(base);
  const { map, invert } = createInterpolator(
    [d0, d1],
    range,
    clamp,
    (value) => Math.log(sign * value) / logBase,
    (linear) => sign * base ** linear,
  );
  return { domain: [d0, d1], range, clamp, base, kind: "log", map, invert };
}

/**
 * Round a positive domain out to whole powers of `base`, so a log axis
 * starts and ends on a labelled tick. A domain that is not strictly positive
 * comes back unchanged.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [base]
 * @returns {[number, number]}
 */
export function niceLogDomain(min, max, base = 10) {
  if (
    !(min > 0) ||
    !(max > 0) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return [min, max];
  }
  const logBase = Math.log(base);
  // Guard against 1000 reading as 10^2.9999999999999996.
  const low = Math.floor(Math.log(min) / logBase + 1e-9);
  let high = Math.ceil(Math.log(max) / logBase - 1e-9);
  if (high <= low) high = low + 1;
  return [base ** low, base ** high];
}

/**
 * Tick values for a log axis: every power of `base` inside the domain. Over
 * fewer than three decades in base 10, the 2 and 5 multiples are added, since
 * powers alone would leave the axis nearly empty.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [base]
 * @returns {number[]}
 */
export function logTicks(min, max, base = 10) {
  if (!(min > 0) || !(max > min) || !Number.isFinite(max)) return [];
  const logBase = Math.log(base);
  const low = Math.floor(Math.log(min) / logBase + 1e-9);
  const high = Math.ceil(Math.log(max) / logBase - 1e-9);
  const multiples = base === 10 && high - low < 3 ? [1, 2, 5] : [1];
  /** @type {number[]} */
  const out = [];
  for (let power = low; power <= high; power++) {
    for (const multiple of multiples) {
      const value = multiple * base ** power;
      if (value >= min * (1 - 1e-9) && value <= max * (1 + 1e-9))
        out.push(value);
    }
  }
  return out;
}
