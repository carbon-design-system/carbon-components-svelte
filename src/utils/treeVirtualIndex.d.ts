import { isExpandableNode } from "./isExpandableNode.js";

type TreeNodeLike = {
  id: string | number;
  nodes?: TreeNodeLike[];
  disabled?: boolean;
  hasChildren?: boolean;
  [key: string]: unknown;
};

export type VisibleTreeRow<T extends TreeNodeLike = TreeNodeLike> = {
  node: T;
  depth: number;
  parentId: string | number | null;
  posInSet: number;
  setSize: number;
  hasChildren: boolean;
};

export type TreeVirtualIndex<T extends TreeNodeLike = TreeNodeLike> = {
  totalCount: number;
  getRowAt: (index: number) => VisibleTreeRow<T> | null;
  collectRows: (startIndex: number, endIndex: number) => VisibleTreeRow<T>[];
  findIndexById: (id: string | number) => number;
};

export { isExpandableNode };

/**
 * Flatten visible (expanded-only) nodes into annotated rows.
 * Iterative — one output array, no recursive spread.
 */
export function flattenVisibleRows<T extends TreeNodeLike>(
  nodes: readonly T[],
  expandedIdsSet: Set<string | number>,
): VisibleTreeRow<T>[];

/**
 * Size cache + row lookup for virtualized trees.
 * Allocates one number per node, not a row object per visible line.
 * `getRowAt` is O(siblings on path); `collectRows` is one cursor walk
 * O(path-to-start + window).
 */
export function createTreeVirtualIndex<T extends TreeNodeLike>(
  nodes: readonly T[],
  expandedIdsSet: Set<string | number>,
): TreeVirtualIndex<T>;
