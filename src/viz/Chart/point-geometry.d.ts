import type { ChartGroup, ChartScales, ChartSeriesKey } from "./model.js";

export type PointOptions<T = unknown> = {
  /** Radius when there is no `size` accessor. @default 4 */
  radius?: number;
  /** Reads the value that sets a circle's area, for a bubble chart. */
  size?: (row: T, index: number) => unknown;
  /** Smallest and largest radius. @default [4, 24] */
  sizeRange?: readonly [number, number];
};

export type PointCircle = {
  key: string;
  series: ChartSeriesKey;
  index: number;
  cx: number;
  cy: number;
  r: number;
  /** The size value, or `null` without a `size` accessor. */
  size: number | null;
  color: string;
};

/**
 * One circle per visible datum with a finite x and y. With a `size`
 * accessor, the circle's area follows the value between the two radii, since
 * a radius that followed it would overstate large values. Sizes share one
 * extent across every series, hidden ones included, so toggling a series
 * never resizes the rest. Larger circles come first, so smaller ones stay on
 * top of them and reachable.
 */
export function buildPoints<T>(
  groups: ReadonlyArray<ChartGroup<T>>,
  scales: ChartScales,
  options?: PointOptions<T>,
): PointCircle[];

/** Paint circles onto a canvas, one path per color. */
export function paintPoints(
  context: CanvasRenderingContext2D,
  circles: ReadonlyArray<PointCircle>,
  resolve: (color: string) => string,
): void;
