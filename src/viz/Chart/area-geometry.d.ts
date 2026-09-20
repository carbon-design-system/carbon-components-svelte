/**
 * Layer geometry for the `Area` mark.
 */
import type { Curve } from "../utils/path-line.js";
import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type AreaStack = "none" | "stacked" | "normalized" | "stream";

export type AreaOptions = {
  /** @default "none" */
  stack?: AreaStack;
  /** @default "linear" */
  curve?: Curve;
};

export type AreaLayer = {
  key: ChartSeriesKey;
  color: string;
  /** Path of the filled layer. */
  area: string;
  /** Path of the line along the layer's upper edge. */
  line: string;
  /** Pixel y of the layer's upper edge at each data x. */
  tops: Map<number, number>;
};

/**
 * The y extent a stacked or stream mark needs the chart to keep in view.
 * `null` for modes that fit inside the data's own extent.
 */
export function areaExtent(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  stack: AreaStack,
): [number, number] | null;

/**
 * One filled layer per visible series, bottom to top, with the line along its
 * upper edge. Stacked modes count a missing value as zero.
 */
export function buildAreas(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  scales: ChartScales,
  options?: AreaOptions,
): AreaLayer[];
