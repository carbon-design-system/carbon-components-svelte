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
 * Give a zero-width domain some span so the single value lands mid-range
 * instead of dividing by zero.
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
