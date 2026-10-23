/**
 * Rectangle geometry for the `Bars` mark.
 */
import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type BarMode = "grouped" | "stacked" | "normalized";

export type BarOptions = {
  /** @default "grouped" */
  mode?: BarMode;
  /** Gap between slots, as a fraction of the slot. @default 0.2 */
  padding?: number;
  /** Gap between grouped bars, as a fraction of a bar. @default 0.1 */
  groupPadding?: number;
  /** Widest a bar may grow, in pixels. @default 48 */
  maxBarWidth?: number;
};

export type BarRect = {
  /** Stable key: series and datum index. */
  key: string;
  series: ChartSeriesKey;
  /** Index of the datum within its series. */
  index: number;
  /** Index of the x slot. */
  slot: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** The datum's own value, before any normalizing. */
  value: number;
};

/**
 * One rectangle per visible datum. Bars grow from the zero line, clamped to
 * the plot, so a negative value hangs below it.
 */
export function buildBars(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  scales: ChartScales,
  options?: BarOptions,
): BarRect[];

/**
 * The largest positive and negative pile across slots, which a stacked mark
 * asks the chart to keep inside the y domain.
 */
export function stackedExtent(
  groups: ReadonlyArray<ChartGroup<unknown>>,
): [number, number];
