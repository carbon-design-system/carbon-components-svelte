/**
 * Rows for a chart's data table: one row per x, one column per series.
 */
import type { ChartGroup, ChartSeriesKey } from "./model.js";

/**
 * Pivot the visible series into rows keyed by x, in ascending x order. A
 * series with no value at an x leaves that cell `undefined`.
 */
export function buildTableRows(groups: ReadonlyArray<ChartGroup<unknown>>): {
  series: ChartSeriesKey[];
  rows: Array<{ x: number; values: Array<number | undefined> }>;
};
