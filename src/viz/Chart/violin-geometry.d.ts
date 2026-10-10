import type { ChartScales } from "./model.js";

export type ViolinInput = {
  /** The category, as it appears on the x scale. */
  x: string | number;
  values: ReadonlyArray<number | null | undefined>;
  q1: number;
  median: number;
  q3: number;
};

/**
 * Pixel positions for one violin. `center` and `width` run along the x
 * scale. Everything else runs along the y scale.
 */
export type ViolinShape = {
  key: string;
  /** Index of the category, which the chart's hover compares against. */
  slot: number;
  center: number;
  width: number;
  /** The outline, both sides. */
  d: string;
  q1: number;
  median: number;
  q3: number;
  /** Where the curve tapers out: at the smallest value, and the largest. */
  start: number;
  end: number;
  count: number;
  bandwidth: number;
};

/** One violin per entry whose category is on the x scale. */
export function buildViolins(
  violins: ReadonlyArray<ViolinInput>,
  scales: ChartScales,
  options?: {
    padding?: number;
    maxWidth?: number;
    bandwidth?: number;
    points?: number;
  },
): ViolinShape[];
