import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type DumbbellOptions = {
  /** The series the bar starts at. Defaults to the first visible series. */
  from?: ChartSeriesKey;
  /** The series the bar ends at. Defaults to the second visible series. */
  to?: ChartSeriesKey;
};

export type Dumbbell = {
  key: string;
  slot: number;
  /** Index of the datum within the `from` series. */
  index: number;
  /** Index of the datum within the `to` series. */
  toIndex: number;
  /** Position along the x scale. */
  along: number;
  /** Positions along the y scale. */
  start: number;
  end: number;
  from: number;
  to: number;
  change: number;
  fromColor: string;
  toColor: string;
};

/**
 * One dumbbell per slot: a dot at the `from` series' value, a dot at the
 * `to` series' value, and a bar between them. Without names, the first two
 * visible series are the pair. A slot missing either value draws nothing.
 */
export function buildDumbbells(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  scales: ChartScales,
  options?: DumbbellOptions,
): Dumbbell[];
