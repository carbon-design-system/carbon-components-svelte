/**
 * Logarithmic scale for data spanning orders of magnitude.
 */
import type { LinearScale } from "./scale-linear.js";

export type LogScaleOptions = {
  domain: readonly [number, number];
  range: readonly [number, number];
  /** @default 10 */
  base?: number;
  clamp?: boolean;
};

export type LogScale = LinearScale & {
  base: number;
  /** `"linear"` when the domain could not support a log scale. */
  kind: "log" | "linear";
};

/**
 * Log scale. The domain must be strictly positive or strictly negative; a
 * domain touching or crossing zero has no logarithm, so it falls back to a
 * linear scale (`kind` reports which one was built).
 */
export function scaleLog(options: LogScaleOptions): LogScale;

/**
 * Round a positive domain out to whole powers of `base`, so a log axis
 * starts and ends on a labelled tick. A domain that is not strictly positive
 * comes back unchanged.
 */
export function niceLogDomain(
  min: number,
  max: number,
  base?: number,
): [number, number];

/**
 * Tick values for a log axis: every power of `base` inside the domain. Over
 * fewer than three decades in base 10, the 2 and 5 multiples are added, since
 * powers alone would leave the axis nearly empty.
 */
export function logTicks(min: number, max: number, base?: number): number[];
