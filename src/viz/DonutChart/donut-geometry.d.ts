import type { VizColor } from "../utils/tokens.js";

export type DonutOptions<T> = {
  value: (row: T, index: number) => unknown;
  category: (row: T, index: number) => unknown;
  /** Slices past the limit fold into one trailing slice. */
  maxSlices?: number;
  otherLabel?: string;
  /** Largest first. @default true */
  sort?: boolean;
  diameter: number;
  /** Hole size as a share of the radius, 0 for a pie. @default 0.6 */
  innerRadius?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type DonutSlice<T> = {
  /** The category, or `"other"` for the folded slice. */
  id: string;
  label: string;
  value: number;
  /** Share of the total, 0 to 1. */
  share: number;
  other: boolean;
  /** The rows summed into this slice. */
  rows: T[];
  color: string;
  /** SVG path, or `""` for a slice with nothing to draw. */
  d: string;
};

export type Donut<T> = { total: number; slices: DonutSlice<T>[] };

/**
 * Sum `rows` by category, fold the tail, and lay the result out as slices,
 * clockwise from 12 o'clock. Categories keep first-seen order unless `sort`
 * is set, which puts the largest first so the fold takes the smallest.
 */
export function buildDonut<T>(
  rows: ReadonlyArray<T>,
  options: DonutOptions<T>,
): Donut<T>;
