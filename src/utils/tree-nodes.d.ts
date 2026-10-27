type TreeNodeLike<Id extends string | number = string | number> = {
  id: Id;
  nodes?: TreeNodeLike<Id>[];
  disabled?: boolean;
  [key: string]: unknown;
};

/** Sentinel parent id for top-level roots in the maps `buildTreeMaps` returns. */
export const ROOT_PARENT_ID: unique symbol;

/** Pre-order flatten of every node. */
export function traverse<T extends TreeNodeLike>(nodes: readonly T[]): T[];

/** Pre-order flatten of the nodes shown while only `expandedIdsSet` is expanded. */
export function traverseVisible<T extends TreeNodeLike>(
  nodes: readonly T[],
  expandedIdsSet: Set<string | number>,
): T[];

/** Node, parent id and child-id maps from one walk. */
export function buildTreeMaps<T extends TreeNodeLike>(
  nodes: readonly T[],
): {
  nodeMap: Map<T["id"], T>;
  parentIdById: Map<T["id"], T["id"] | typeof ROOT_PARENT_ID>;
  childIdsByParentId: Map<T["id"] | typeof ROOT_PARENT_ID, Array<T["id"]>>;
};

/** Ancestor ids from the forest root to the parent of `id`. */
export function getAncestorIds<Id extends string | number>(
  id: Id,
  parentIdById: Map<Id, Id | typeof ROOT_PARENT_ID> | null,
): Id[];

/** Ids a multiselect gesture on `node` selects (enabled nodes only). */
export function multiselectExpansionIds(
  node: TreeNodeLike,
  mode: "node" | "shallow" | "deep",
): Array<string | number>;
