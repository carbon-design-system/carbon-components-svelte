import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type WaterfallOptions = {
  /** Categories drawn as subtotals, from zero to the running total. */
  totals?: ReadonlyArray<string>;
  /** Gap between slots, as a fraction of the slot. @default 0.3 */
  padding?: number;
  /** Widest a bar may grow, in pixels. @default 64 */
  maxBarWidth?: number;
};

export type WaterfallBar = {
  key: string;
  series: ChartSeriesKey;
  index: number;
  slot: number;
  kind: "increase" | "decrease" | "total";
  /** Running total before this step. Zero for a subtotal. */
  from: number;
  /** Running total after this step. */
  to: number;
  /** The step, or the running total for a subtotal. */
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WaterfallConnector = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Waterfall = {
  bars: WaterfallBar[];
  connectors: WaterfallConnector[];
  /** Lowest and highest running total, which the y domain must hold. */
  extent: [number, number] | null;
};

/**
 * Walk the first visible series as a running total. Each bar floats from
 * the total before it to the total after it. A slot named in `totals` is a
 * subtotal: its bar rises from zero to the running total, and its own value
 * is ignored. A connector joins each bar's end to the next bar's start.
 */
export function buildWaterfall(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  scales: ChartScales,
  options?: WaterfallOptions,
): Waterfall;
