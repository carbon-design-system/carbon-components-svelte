/**
 * Continuous scale: maps a numeric domain onto a pixel range and back.
 */

export type LinearScaleOptions = {
  domain: readonly [number, number];
  range: readonly [number, number];
  /** Keep `map` output inside the range and `invert` inside the domain. */
  clamp?: boolean;
  /** Widen the domain to tick boundaries. A number is the tick count hint. */
  nice?: boolean | number;
};

export type LinearScale = {
  /** Resolved domain, after flat-domain widening and `nice`. */
  domain: [number, number];
  range: readonly [number, number];
  clamp: boolean;
  map(value: number): number;
  invert(px: number): number;
};

/**
 * Give a zero-width domain some span instead of dividing by zero. A non-zero
 * value lands mid-range. A flat zero becomes `[0, 1]`, so an all-zero series
 * sits on the baseline rather than floating in the middle of the plot.
 */
export function expandFlatDomain(d0: number, d1: number): [number, number];

/**
 * Build `map`/`invert` for a domain already in linear space. `forward` and
 * `backward` convert between data and linear space.
 */
export function createInterpolator(
  domain: readonly [number, number],
  range: readonly [number, number],
  clamp: boolean,
  forward?: (value: number) => number,
  backward?: (value: number) => number,
): { map: (value: number) => number; invert: (px: number) => number };

/**
 * Linear scale. Reversed ranges (SVG `y`: `[height, 0]`) and reversed
 * domains work. A zero-width domain is widened so it never yields `NaN`.
 */
export function scaleLinear(options: LinearScaleOptions): LinearScale;
