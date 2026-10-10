import type { VizColor } from "../utils/tokens.js";

export type RidgelineOptions<T> = {
  x: (row: T, index: number) => unknown;
  series: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  order?: "none" | "median";
  width: number;
  rowHeight: number;
  /** How far a row may rise into the one above, as a share of the row. */
  overlap?: number;
  bandwidth?: number;
  points?: number;
  colorBy?: "none" | "series";
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type RidgelineRow<T> = {
  key: string;
  label: string;
  /** First-seen order. */
  index: number;
  /** Drawing order, top down. */
  order: number;
  /** The baseline. */
  y: number;
  /** The curve alone, and the curve closed to the baseline. */
  line: string;
  area: string;
  count: number;
  median: number;
  /** The value at the highest density. */
  peak: number;
  color: string | undefined;
  datum: T;
};

export type Ridgeline<T> = {
  rows: RidgelineRow<T>[];
  domain: [number, number];
  ticks: Array<{ value: number; x: number }>;
  height: number;
};

/** A density curve per series on one shared scale, rows overlapping. */
export function buildRidgeline<T>(
  rows: ReadonlyArray<T>,
  options: RidgelineOptions<T>,
): Ridgeline<T>;
