// @ts-check
// Ordinal scales: evenly divide a pixel range among discrete keys.

/** @typedef {import("./scale-band.d.ts").BandScaleOptions<any>} BandScaleOptions */

/**
 * Band scale for bars and cells. Lookups go through a prebuilt `Map`, so
 * `map` is O(1). On duplicate keys the first occurrence wins.
 *
 * @template K
 * @param {import("./scale-band.d.ts").BandScaleOptions<K>} options
 * @returns {import("./scale-band.d.ts").BandScale<K>}
 */
export function scaleBand({
  domain,
  range,
  paddingInner = 0,
  paddingOuter = 0,
  align = 0.5,
  round = false,
}) {
  /** @type {Map<K, number>} */
  const index = new Map();
  /** @type {K[]} */
  const keys = [];
  for (const key of domain) {
    if (index.has(key)) continue;
    index.set(key, keys.length);
    keys.push(key);
  }

  const count = keys.length;
  const [r0, r1] = range;
  const reversed = r1 < r0;
  const lo = reversed ? r1 : r0;
  const hi = reversed ? r0 : r1;

  let step = (hi - lo) / Math.max(1, count - paddingInner + paddingOuter * 2);
  if (round) step = Math.floor(step);
  let start = lo + (hi - lo - step * (count - paddingInner)) * align;
  let bandwidth = step * (1 - paddingInner);
  if (round) {
    start = Math.round(start);
    bandwidth = Math.round(bandwidth);
  }

  return {
    domain: keys,
    range,
    step,
    bandwidth,
    map(key) {
      const i = index.get(key);
      if (i === undefined) return undefined;
      return start + step * (reversed ? count - 1 - i : i);
    },
    invert(px) {
      if (count === 0 || step === 0) return undefined;
      const slot = Math.floor((px - start) / step);
      const i = Math.min(count - 1, Math.max(0, slot));
      return keys[reversed ? count - 1 - i : i];
    },
  };
}

/**
 * Point scale for line and scatter marks on a categorical axis: a band scale
 * with zero bandwidth. `padding` is the outer gap in steps. A single key
 * sits at the middle of the range.
 *
 * @template K
 * @param {import("./scale-band.d.ts").PointScaleOptions<K>} options
 * @returns {import("./scale-band.d.ts").BandScale<K>}
 */
export function scalePoint({ domain, range, padding = 0, align, round }) {
  return scaleBand({
    domain,
    range,
    paddingInner: 1,
    paddingOuter: padding,
    align,
    round,
  });
}
