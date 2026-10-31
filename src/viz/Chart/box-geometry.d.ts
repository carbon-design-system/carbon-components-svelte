import type { ChartScales } from "./model.js";

export type BoxInput = {
  /** The category, as it appears on the x scale. */
  x: string | number;
  q1: number;
  median: number;
  q3: number;
  whiskerLow: number;
  whiskerHigh: number;
  outliers: ReadonlyArray<number>;
};

/**
 * Pixel positions for one box. `center` and `width` run along the x scale.
 * Everything else runs along the y scale.
 */
export type BoxShape = {
  key: string;
  /** Index of the category, which the chart's hover compares against. */
  slot: number;
  center: number;
  width: number;
  boxStart: number;
  boxLength: number;
  median: number;
  whiskerLow: number;
  whiskerHigh: number;
  q1: number;
  q3: number;
  outliers: number[];
};

/**
 * One box per entry whose category is on the x scale. `along` values run
 * along the x scale and `across` values along the y scale, so the component
 * can draw either orientation from the same numbers.
 */
export function buildBoxes(
  boxes: ReadonlyArray<BoxInput>,
  scales: ChartScales,
  options?: { padding?: number; maxBoxWidth?: number },
): BoxShape[];
