export type RangeInput = {
  min: number;
  max: number;
  value?: number | null;
  /** First quartile, median, third quartile. */
  quartiles?: readonly [number, number, number] | ReadonlyArray<number>;
};

export type RangeGeometry = {
  /** Position of the value, 0 to 100, or `null` without a value. */
  valuePct: number | null;
  /** Which side the value was clamped from, or `null` when inside. */
  outside: "below" | "above" | null;
  box: { startPct: number; widthPct: number; medianPct: number } | null;
};

/**
 * Positions for a value within `[min, max]`, as percentages, with an optional
 * box from the first to the third quartile. Everything is clamped to the
 * domain. A flat or non-finite domain yields zeros and no box.
 */
export function getRangeGeometry(input: RangeInput): RangeGeometry;
