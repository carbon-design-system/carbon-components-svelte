/**
 * Status thresholds shared by gauges, bullets, meters, and chart rules.
 */

export type Threshold = {
  value: number;
  kind: "success" | "warning" | "error" | "info";
  label?: string;
};

/** The array form, or the `{ warning, error }` object `Meter` takes. */
export type ThresholdInput =
  | ReadonlyArray<Threshold>
  | { warning?: number; error?: number };

export type ThresholdCrossing = {
  threshold: Threshold;
  direction: "above" | "below";
};

/**
 * Normalize thresholds to an ascending array. Accepts the array form, or the
 * `{ warning, error }` object `Meter` takes.
 */
export function normalizeThresholds(
  thresholds: ThresholdInput | null | undefined,
): Threshold[];

/**
 * Status at `value`: the kind of the highest threshold it has reached
 * (`value >= threshold.value`), or `"default"` below them all.
 */
export function statusAt(
  value: number,
  thresholds: ReadonlyArray<Threshold>,
): Threshold["kind"] | "default";

/**
 * Thresholds crossed between two readings, in the order crossed. Reaching a
 * threshold counts as crossing above it (`prev < t <= next`), and leaving it
 * as crossing below (`next < t <= prev`).
 */
export function crossings(
  prev: number,
  next: number,
  thresholds: ReadonlyArray<Threshold>,
): ThresholdCrossing[];
