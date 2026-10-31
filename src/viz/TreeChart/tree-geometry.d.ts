export type TreeOptions<T> = {
  id: (row: T, index: number) => unknown;
  parent: (row: T, index: number) => unknown;
  label: (row: T, index: number) => unknown;
  /** Ids of the nodes whose children are folded away. */
  collapsed?: ReadonlyArray<string | number>;
  width: number;
  height: number;
  /** Room kept on either side for labels. @default 96 */
  labelSpace?: number;
  align?: "depth" | "leaves";
};

export type TreeChartNode<T> = {
  id: string;
  /** Position in depth first order, which the keyboard follows. */
  index: number;
  label: string;
  row: T;
  parentId: string | null;
  depth: number;
  x: number;
  y: number;
  /** Whether the node has children, shown or folded away. */
  branch: boolean;
  collapsed: boolean;
  childCount: number;
};

export type Tree<T> = {
  nodes: TreeChartNode<T>[];
  links: Array<{ id: string; path: string }>;
};

/**
 * Lay out the rows that are not inside a collapsed node. The layout leaves
 * `labelSpace` free on either side: branch labels hang to the left of their
 * node and leaf labels to the right.
 */
export function buildTree<T>(
  rows: ReadonlyArray<T>,
  options: TreeOptions<T>,
): Tree<T>;
