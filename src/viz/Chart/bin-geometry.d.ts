import type { ChartGroup, ChartScales } from "./model.js";

export type BinRect = {
  key: string;
  series: string | number;
  index: number;
  /** The datum's x, which the chart's hover compares against. */
  at: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

/**
 * One rectangle per bin with a positive count, spanning the bin's edges on
 * the x scale and rising from zero on the y scale. Neighbors share an edge,
 * less a one pixel gap, because a histogram's bars touch. Each datum needs
 * numeric `x0` and `x1` properties.
 */
export function buildBins(
  groups: ReadonlyArray<ChartGroup<{ x0: number; x1: number }>>,
  scales: ChartScales,
  options?: { gap?: number },
): BinRect[];
