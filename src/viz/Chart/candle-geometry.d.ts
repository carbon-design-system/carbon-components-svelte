import type { ChartScales } from "./model.js";

export type CandleInput = {
  /** The category, as it appears on the x scale. */
  x: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Pixel positions for one candle. `center` and `width` run along the x
 * scale. Everything else runs along the y scale.
 */
export type CandleShape = {
  key: string;
  /** Index of the category, which the chart's hover compares against. */
  slot: number;
  center: number;
  width: number;
  bodyStart: number;
  bodyLength: number;
  wickLow: number;
  wickHigh: number;
  up: boolean;
  down: boolean;
  change: number;
};

/** One candle per entry whose category is on the x scale. */
export function buildCandles(
  candles: ReadonlyArray<CandleInput>,
  scales: ChartScales,
  options?: { padding?: number; maxBodyWidth?: number },
): CandleShape[];
