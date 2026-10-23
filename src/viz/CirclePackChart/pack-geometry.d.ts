import type { VizColor } from "../utils/tokens.js";

export type PackOptions<T> = {
  value: (row: T, index: number) => unknown;
  label: (row: T, index: number) => unknown;
  /** Groups leaves inside a parent circle, which sets their color. */
  group?: (row: T, index: number) => unknown;
  /** Width and height of the square the pack is scaled to. */
  size: number;
  /** Gap between circles, in pixels. @default 3 */
  padding?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type PackLeaf<T> = {
  /** Unique across the chart: the group and the leaf keys joined. */
  id: string;
  key: string;
  group: string;
  value: number;
  /** Share of the whole, 0 to 1. */
  share: number;
  rows: T[];
  cx: number;
  cy: number;
  r: number;
  /** The key, shortened to fit, or `""` when the circle is too small. */
  label: string;
};

export type PackGroup<T> = {
  /** `""` without a `group` accessor. */
  key: string;
  value: number;
  share: number;
  color: string;
  cx: number;
  cy: number;
  r: number;
  leaves: PackLeaf<T>[];
};

export type Pack<T> = {
  total: number;
  grouped: boolean;
  groups: PackGroup<T>[];
};

/**
 * Sum `rows` by label, pack each group's leaves, pack the groups, and scale
 * the whole to `size`. A circle's area follows its value. Without a `group`
 * accessor every leaf sits in one unnamed group. A leaf carries a label only
 * when its circle can hold one.
 */
export function buildPack<T>(
  rows: ReadonlyArray<T>,
  options: PackOptions<T>,
): Pack<T>;
