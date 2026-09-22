/**
 * Geometry for the `Band` mark.
 */
import type { Curve } from "../utils/path-line.js";
import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type BandOptions<T> = {
  lower: (row: T, index: number) => unknown;
  upper: (row: T, index: number) => unknown;
  /** @default "linear" */
  curve?: Curve;
};

export type BandPath = { key: ChartSeriesKey; color: string; d: string };

/** The y range the bands cover, or `null` when no datum has both bounds. */
export function bandExtent<T>(
  groups: ReadonlyArray<ChartGroup<T>>,
  lower: (row: T, index: number) => unknown,
  upper: (row: T, index: number) => unknown,
): [number, number] | null;

/** One filled path per visible series. A datum missing a bound is a gap. */
export function buildBands<T>(
  groups: ReadonlyArray<ChartGroup<T>>,
  scales: ChartScales,
  options: BandOptions<T>,
): BandPath[];
