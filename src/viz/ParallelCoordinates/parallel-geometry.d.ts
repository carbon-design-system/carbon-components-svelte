import type { LinearScale } from "../utils/scale-linear.js";
import type { VizColor } from "../utils/tokens.js";

export type ParallelDimension = {
  key: string;
  label?: string;
  /** Fixed ends of the axis. Defaults to the extent, rounded out. */
  domain?: readonly [number, number];
};

export type ParallelOptions<T> = {
  dimensions: ReadonlyArray<string | ParallelDimension>;
  series?: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  hidden?: ReadonlyArray<string>;
  palette?: number;
  colors?: Record<string, VizColor>;
  /** The box the axes stand in. */
  plot: { x0: number; x1: number; y0: number; y1: number };
};

export type ParallelAxis = {
  key: string;
  label: string;
  index: number;
  x: number;
  domain: [number, number];
  scale: LinearScale;
  ticks: Array<{ value: number; y: number }>;
};

export type ParallelLine<T> = {
  /** The row's index as a string. */
  id: string;
  index: number;
  label: string;
  series: string;
  color: string;
  hidden: boolean;
  /** Value per dimension, in axis order. `NaN` where missing. */
  values: number[];
  points: Array<{ x: number; y: number } | null>;
  /** SVG path through the axes, with a gap where a value is missing. */
  d: string;
  datum: T;
};

export type Parallel<T> = {
  axes: ParallelAxis[];
  lines: ParallelLine<T>[];
  series: Array<{ key: string; color: string; hidden: boolean }>;
};

/** One axis per dimension and one polyline per row. */
export function buildParallel<T>(
  rows: ReadonlyArray<T>,
  options: ParallelOptions<T>,
): Parallel<T>;

/** Whether a row passes every brush. A row missing a brushed dimension fails. */
export function passesBrushes(
  values: ReadonlyArray<number>,
  brushes: ReadonlyArray<{ index: number; range: readonly [number, number] }>,
): boolean;

/** Index of the line nearest a point, or `-1` when none is within reach. */
export function nearestLine(
  lines: ReadonlyArray<{
    points: ReadonlyArray<{ x: number; y: number } | null>;
    hidden: boolean;
    kept: boolean;
  }>,
  axes: ReadonlyArray<{ x: number }>,
  x: number,
  y: number,
  within?: number,
): number;
