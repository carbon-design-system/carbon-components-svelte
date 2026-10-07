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
