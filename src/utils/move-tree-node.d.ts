type NodeLike = {
  id: string | number;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

type MoveTreeNodeOptions<Id> = {
  /** Id of the node to move next to or into. */
  target: Id;
  /**
   * Where to place the moved nodes: as the target's previous or next
   * siblings, or appended to its children.
   */
  position: "before" | "after" | "inside";
};

/**
 * Move one or more nodes to a new place in a tree, returning a new tree.
 * Returns `tree` itself when the move is invalid (unknown id or target, or a
 * target that is a moved node or inside one).
 */
export function moveTreeNode<T extends NodeLike>(
  tree: ReadonlyArray<T>,
  ids: T["id"] | ReadonlyArray<T["id"]>,
  options: MoveTreeNodeOptions<T["id"]>,
): ReadonlyArray<T>;
