import type { VizColor } from "../utils/tokens.js";
import type { TreemapRect } from "../utils/treemap.js";

export type TreemapOptions<T> = {
  value: (row: T, index: number) => unknown;
  label: (row: T, index: number) => unknown;
  /** Groups leaves under a parent, which sets their color. */
  group?: (row: T, index: number) => unknown;
  /** Width over height of the box. @default 2 */
  aspect?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type TreemapLeaf<T> = {
  /** Unique across the chart: the group and the leaf keys joined. */
  id: string;
  key: string;
  group: string;
  value: number;
  /** Share of the whole, 0 to 1. */
  share: number;
  rows: T[];
  /** Width and height as shares of the whole box, to judge what text fits. */
  span: { width: number; height: number };
  /** Percentages of the group's box. */
  rect: TreemapRect;
};

export type TreemapGroup<T> = {
  key: string;
  value: number;
  share: number;
  color: string;
  /** Percentages of the whole box. */
  rect: TreemapRect;
  leaves: TreemapLeaf<T>[];
};

export type Treemap<T> = {
  total: number;
  /** Whether a `group` accessor was given. */
  grouped: boolean;
  groups: TreemapGroup<T>[];
};

/**
 * Sum `rows` by label, tile the groups into a box of the given aspect ratio,
 * then tile each group's leaves inside it. Rectangles are percentages: a
 * group's of the whole, a leaf's of its group, which is how nested absolutely
 * positioned elements want them. Without a `group` accessor every leaf is its
 * own group. Groups and leaves come out largest first.
 */
export function buildTreemap<T>(
  rows: ReadonlyArray<T>,
  options: TreemapOptions<T>,
): Treemap<T>;
