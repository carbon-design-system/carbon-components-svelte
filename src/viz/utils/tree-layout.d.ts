export type TreeLayoutOptions<T> = {
  id: (row: T, index: number) => unknown;
  /** `null`, `undefined`, or `""` for a root. */
  parent: (row: T, index: number) => unknown;
  width: number;
  height: number;
  /**
   * `"depth"` puts a node in the column of its depth. `"leaves"` moves every
   * leaf to the last column, as in a dendrogram.
   * @default "depth"
   */
  align?: "depth" | "leaves";
};

export type TreeNode<T> = {
  id: string;
  row: T;
  parent: TreeNode<T> | null;
  children: TreeNode<T>[];
  depth: number;
  leaf: boolean;
  x: number;
  y: number;
};

export type TreeLink<T> = {
  source: TreeNode<T>;
  target: TreeNode<T>;
  /** SVG path of the curve from the parent to the child. */
  path: string;
};

export type TreeLayout<T> = {
  /** Depth first, parents before their children. */
  nodes: TreeNode<T>[];
  links: TreeLink<T>[];
  /** Depth of the deepest node. */
  depth: number;
  leaves: number;
};

/**
 * Build a tree from rows that each name their parent, and lay it out left to
 * right: a node's column is its depth, leaves take consecutive rows, and a
 * parent sits midway between its first and last child. Rows with no parent,
 * or with a parent that is not in the data, are roots. A row that would make
 * a cycle is treated as a root, and a repeated id keeps its first row.
 */
export function treeLayout<T>(
  rows: ReadonlyArray<T>,
  options: TreeLayoutOptions<T>,
): TreeLayout<T>;
