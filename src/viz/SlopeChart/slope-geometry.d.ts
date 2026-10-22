import type { VizColor } from "../utils/tokens.js";

export type SlopeOptions<T> = {
  x: (row: T, index: number) => unknown;
  y: (row: T, index: number) => unknown;
  series: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** The two periods to compare. Defaults to the first two seen. */
  periods?: ReadonlyArray<string | number>;
  width: number;
  height: number;
  /** Room for the labels on each side. */
  labelWidth: number;
  /** Least distance between labels on one side. */
  labelGap?: number;
  /** Whether the scale must include zero. */
  zero?: boolean;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type SlopeLine<T> = {
  key: string;
  index: number;
  label: string;
  from: number;
  to: number;
  change: number;
  direction: "up" | "down" | "flat";
  /** Where the line starts and ends. */
  y1: number;
  y2: number;
  /** Where the labels sit, pushed apart so they never overlap. */
  leftY: number;
  rightY: number;
  color: string;
  fromDatum: T;
  toDatum: T;
};

export type Slope<T> = {
  periods: [string, string];
  /** In series order, as first seen. */
  lines: SlopeLine<T>[];
  /** The x of the two columns. */
  x0: number;
  x1: number;
  domain: [number, number];
  ticks: Array<{ value: number; y: number }>;
};

/** A line per series between its values in two periods. */
export function buildSlope<T>(
  rows: ReadonlyArray<T>,
  options: SlopeOptions<T>,
): Slope<T>;
