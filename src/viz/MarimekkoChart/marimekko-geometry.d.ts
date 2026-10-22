import type { VizColor } from "../utils/tokens.js";

export type MarimekkoOptions<T> = {
  x: (row: T, index: number) => unknown;
  y: (row: T, index: number) => unknown;
  series: (row: T, index: number) => unknown;
  /** The column's label, read from its first row. Defaults to the key. */
  label?: (row: T, index: number) => unknown;
  /** The column's size, read from its first row. Defaults to its total. */
  xValue?: (row: T, index: number) => unknown;
  sort?: "none" | "value";
  width: number;
  height: number;
  gap?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type MarimekkoCell<T> = {
  key: string;
  column: string;
  value: number;
  /** Share of the column. */
  share: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  color: string;
  datum: T;
  index: number;
};

export type MarimekkoColumn<T> = {
  key: string;
  label: string;
  order: number;
  /** What sets the width: the given size or the total. */
  size: number;
  total: number;
  /** Share of the whole width. */
  share: number;
  x0: number;
  x1: number;
  /** In series order, top down. */
  cells: MarimekkoCell<T>[];
};

export type Marimekko<T> = {
  columns: MarimekkoColumn<T>[];
  series: Array<{ key: string; color: string }>;
  total: number;
};

/** A column per category as wide as its size, split by series share. */
export function buildMarimekko<T>(
  rows: ReadonlyArray<T>,
  options: MarimekkoOptions<T>,
): Marimekko<T>;
