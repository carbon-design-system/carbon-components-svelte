// @ts-check
// Human-friendly axis ticks on 1, 2, and 5 multiples of a power of ten.

const E10 = Math.sqrt(50);
const E5 = Math.sqrt(10);
const E2 = Math.sqrt(2);

/**
 * Step for about `count` ticks across `[min, max]`. A negative result is the
 * inverse of a fractional step (`-20` means `1 / 20`), so callers can derive
 * ticks by integer division and avoid accumulating float error.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} count
 * @returns {number}
 */
function tickIncrement(min, max, count) {
  const raw = (max - min) / Math.max(1, count);
  const power = Math.floor(Math.log10(raw));
  const error = raw / 10 ** power;
  const factor = error >= E10 ? 10 : error >= E5 ? 5 : error >= E2 ? 2 : 1;
  return power >= 0 ? factor * 10 ** power : -(10 ** -power) / factor;
}

/**
 * Distance between ticks for about `count` ticks across `[min, max]`.
 * `0` for an empty or non-finite span.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [count]
 * @returns {number}
 */
export function tickStep(min, max, count = 5) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (!(hi > lo) || !Number.isFinite(hi - lo)) return 0;
  const increment = tickIncrement(lo, hi, count);
  return increment > 0 ? increment : 1 / -increment;
}

/**
 * About `count` ascending tick values inside `[min, max]`. Bounds may be
 * given in either order. A zero-width span yields that one value.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [count]
 * @returns {number[]}
 */
export function ticks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (lo === hi) return [lo];

  const increment = tickIncrement(lo, hi, count);
  if (!Number.isFinite(increment) || increment === 0) return [];

  /** @type {number[]} */
  const values = [];
  if (increment > 0) {
    const first = Math.ceil(lo / increment);
    const last = Math.floor(hi / increment);
    for (let i = first; i <= last; i++) values.push(i * increment);
  } else {
    const inverse = -increment;
    const first = Math.ceil(lo * inverse);
    const last = Math.floor(hi * inverse);
    for (let i = first; i <= last; i++) values.push(i / inverse);
  }
  return values;
}

/**
 * Widen `[min, max]` outward to the nearest tick boundaries. Keeps the input
 * order, so a reversed domain stays reversed.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [count]
 * @returns {[number, number]}
 */
export function niceDomain(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return [min, max];
  }
  const reversed = min > max;
  let lo = reversed ? max : min;
  let hi = reversed ? min : max;

  // Widening can change the step, so settle it with a second pass.
  for (let pass = 0; pass < 2; pass++) {
    const increment = tickIncrement(lo, hi, count);
    if (!Number.isFinite(increment) || increment === 0) break;
    if (increment > 0) {
      lo = Math.floor(lo / increment) * increment;
      hi = Math.ceil(hi / increment) * increment;
    } else {
      const inverse = -increment;
      lo = Math.floor(lo * inverse) / inverse;
      hi = Math.ceil(hi * inverse) / inverse;
    }
  }
  return reversed ? [hi, lo] : [lo, hi];
}
