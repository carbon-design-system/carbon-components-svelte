import type { VizColor } from "../utils/tokens.js";

export type BumpOptions<T> = {
  x: (row: T, index: number) => unknown;
  /** The rank, one the best. Leave out to rank by `y`. */
  rank?: (row: T, index: number) => unknown;
  /** The value, ranked largest first when there is no `rank`. */
  y?: (row: T, index: number) => unknown;
  series: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** The periods in order. Defaults to the order first seen. */
  periods?: ReadonlyArray<string | number>;
  width: number;
  height: number;
  /** Room for the labels on each side. */
  labelWidth: number;
  /** Least distance between labels on one side. */
  labelGap?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type BumpPoint<T> = {
  period: string;
  /** The period's position. */
  at: number;
  rank: number;
  value: number | undefined;
  x: number;
  y: number;
  datum: T;
};

export type BumpLine<T> = {
  key: string;
  index: number;
  label: string;
  color: string;
  /** In period order, skipping periods the series is missing. */
  points: BumpPoint<T>[];
  /** The line's path; a missing period starts a new run. */
  d: string;
  start: number | null;
  end: number | null;
  /** Ranks climbed from the first period to the last; negative when it fell. */
  change: number;
  /** Where the end labels sit, pushed apart so they never overlap. */
  leftY: number;
  rightY: number;
};

export type Bump<T> = {
  periods: Array<{ key: string; x: number }>;
  /** In series order, as first seen. */
  lines: BumpLine<T>[];
  ranks: Array<{ rank: number; y: number }>;
  x0: number;
  x1: number;
};

/** A line per series through its rank in each period. */
export function buildBump<T>(
  rows: ReadonlyArray<T>,
  options: BumpOptions<T>,
): Bump<T>;
