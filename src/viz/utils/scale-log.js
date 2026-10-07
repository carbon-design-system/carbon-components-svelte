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
