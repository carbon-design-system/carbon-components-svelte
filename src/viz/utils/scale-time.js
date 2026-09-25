// @ts-check
// Time scale: a linear scale over epoch milliseconds.
import { createInterpolator, expandFlatDomain } from "./scale-linear.js";
import { niceTimeDomain } from "./time-ticks.js";

/** @typedef {import("./scale-time.d.ts").TimeScale} TimeScale */
/** @typedef {import("./scale-time.d.ts").TimeScaleOptions} TimeScaleOptions */

/**
 * Time scale. `map` accepts a `Date` or epoch milliseconds; `invert` returns
 * milliseconds. `nice` widens the domain to the calendar boundaries its
 * ticks would use.
 *
 * @param {TimeScaleOptions} options
 * @returns {TimeScale}
 */
export function scaleTime({
  domain,
  range,
  clamp = false,
  nice = false,
  utc = false,
}) {
  let [d0, d1] = expandFlatDomain(+domain[0], +domain[1]);

  if (nice && d0 !== d1) {
    const reversed = d0 > d1;
    const [lo, hi] = niceTimeDomain(
      reversed ? d1 : d0,
      reversed ? d0 : d1,
      nice === true ? 6 : nice,
      { utc },
    );
    d0 = reversed ? hi : lo;
    d1 = reversed ? lo : hi;
  }

  /** @type {[number, number]} */
  const resolved = [d0, d1];
  const { map, invert } = createInterpolator(resolved, range, clamp);
  return {
    domain: resolved,
    range,
    clamp,
    utc,
    map: (value) => map(+value),
    invert,
  };
}
