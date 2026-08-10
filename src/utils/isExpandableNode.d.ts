type ExpandableNodeLike = {
  nodes?: unknown[];
  hasChildren?: boolean;
};

/** True when the node can expand (loaded children or lazy `hasChildren`). */
export function isExpandableNode<T extends ExpandableNodeLike>(node: T): boolean;
