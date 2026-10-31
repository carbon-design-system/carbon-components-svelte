/**
 * Partition layout: a tree as nested slices, in shares of the root.
 */
export type PartitionOptions<T> = {
  id: (row: T, index: number) => unknown;
  /** `null`, `undefined`, or `""` for a root. */
  parent: (row: T, index: number) => unknown;
  /** A node's own value. A parent without one is worth its children. */
  value: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** Children in input order, or largest first. @default "none" */
  sort?: "none" | "value";
  /** The id to scope the layout to. Its ancestors stay, at full width. */
  root?: string | number;
  /** Levels below the root to lay out. */
  maxDepth?: number;
};

export type PartitionNode<T> = {
  id: string;
  parent: string | null;
  label: string;
  /** Rows from the top of what is shown: ancestors of the root come first. */
  depth: number;
  /** The rolled-up value. */
  value: number;
  /** What the node is worth beyond its children. */
  own: number;
  /** Share of what is shown, 0 to 1. */
  share: number;
  /** Left and right edges as percentages of the width. */
  x0: number;
  x1: number;
  datum: T;
  index: number;
  children: PartitionNode<T>[];
  leaf: boolean;
  /** Above the root: a full-width step back up. */
  ancestor: boolean;
};

export type Partition<T> = {
  /** The value of what is shown. */
  total: number;
  /** Depth of the deepest node laid out. */
  depth: number;
  /** How many ancestor rows sit above the root. */
  ancestors: number;
  /** Depth first, parents before their children. */
  nodes: PartitionNode<T>[];
};

/**
 * Lay the tree out as nested slices. A node's value is its own, or the sum
 * of its children, and never less than its children add up to.
 */
export function partition<T>(
  rows: ReadonlyArray<T>,
  options: PartitionOptions<T>,
): Partition<T>;
