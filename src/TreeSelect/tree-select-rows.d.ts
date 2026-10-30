export type TreeSelectNodeId = string | number;

export interface TreeSelectBaseNode {
  id: TreeSelectNodeId;
  disabled?: boolean;
  hasChildren?: boolean;
  nodes?: TreeSelectBaseNode[];
}

export interface TreeSelectRow<T extends TreeSelectBaseNode> {
  node: T;
  /** Zero-based nesting depth */
  depth: number;
  parentId: TreeSelectNodeId | null;
  /** One-based position among siblings */
  posInSet: number;
  /** Number of siblings */
  setSize: number;
  /** Has loaded children, or is a lazy parent */
  expandable: boolean;
  expanded: boolean;
}

/** Id lookups for the whole tree, with a document-order ordinal per node. */
export function indexTree<T extends TreeSelectBaseNode>(
  nodes: ReadonlyArray<T>,
): {
  byId: Map<TreeSelectNodeId, T>;
  parentById: Map<TreeSelectNodeId, TreeSelectNodeId | null>;
  ordinalById: Map<TreeSelectNodeId, number>;
};

/** Ids of every node that has loaded children. */
export function expandableIds(
  nodes: ReadonlyArray<TreeSelectBaseNode>,
): Set<TreeSelectNodeId>;

/** The rows the menu shows: every node whose ancestors are all expanded. */
export function flattenVisible<T extends TreeSelectBaseNode>(
  nodes: ReadonlyArray<T>,
  expanded: ReadonlySet<TreeSelectNodeId>,
): Array<TreeSelectRow<T>>;

/** Overlay lazily loaded children onto a tree without mutating it. */
export function withLoadedChildren<T extends TreeSelectBaseNode>(
  nodes: ReadonlyArray<T>,
  loaded: ReadonlyMap<TreeSelectNodeId, ReadonlyArray<T>>,
): ReadonlyArray<T>;

/** Which checked ids the field reports. */
export function shownCheckedIds(
  checkedIds: ReadonlyArray<TreeSelectNodeId>,
  strategy: "all" | "parent" | "leaf",
  index: {
    byId: ReadonlyMap<TreeSelectNodeId, TreeSelectBaseNode>;
    parentById: ReadonlyMap<TreeSelectNodeId, TreeSelectNodeId | null>;
  },
): Array<TreeSelectNodeId>;

/** Whether two id lists hold the same ids in the same order. */
export function sameIds(
  a: ReadonlyArray<TreeSelectNodeId>,
  b: ReadonlyArray<TreeSelectNodeId>,
): boolean;

/** Ids added to and removed from `prev` to reach `next`. */
export function diffIds(
  prev: ReadonlyArray<TreeSelectNodeId>,
  next: ReadonlyArray<TreeSelectNodeId>,
): {
  added: Array<TreeSelectNodeId>;
  removed: Array<TreeSelectNodeId>;
};

/**
 * Ids that match no node while some lazy parent has not loaded, so they
 * may name a node that is not loaded yet.
 */
export function unresolvedIds(
  ids: ReadonlyArray<TreeSelectNodeId>,
  index: { byId: ReadonlyMap<TreeSelectNodeId, TreeSelectBaseNode> },
): Array<TreeSelectNodeId>;
