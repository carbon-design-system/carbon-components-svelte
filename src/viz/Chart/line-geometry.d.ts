/**
 * Path geometry for the `Line` mark.
 */
import type { Curve } from "../utils/path-line.js";
import type { ChartGroup, ChartScales } from "./model.js";

/**
 * SVG path `d` for one series. A long series is downsampled to `budget`
 * points first, over an index array so the chart's own rows stay untouched.
 * A non-finite y is a gap.
 */
export function buildLinePath(
  group: ChartGroup<unknown>,
  scales: ChartScales,
  options?: { curve?: Curve; budget?: number },
): string;
