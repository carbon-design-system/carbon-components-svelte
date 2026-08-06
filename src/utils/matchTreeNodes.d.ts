type NodeLike = {
  id: string | number;
  text?: unknown;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

/** Character offsets `[start, end]` of a match within a node's `text`. */
export type TreeNodeMatchRange = [start: number, end: number];

export type TreeNodeMatches<Id extends string | number = string | number> = {
  /** Nodes whose own `text` matches. */
  matchedIds: Set<Id>;
  /** Nodes visible only because a descendant matched. */
  ancestorIds: Set<Id>;
  /** Every node that stays visible: the matches, their ancestors, and the descendants of a matching node. */
  visibleIds: Set<Id>;
  /** Matched node id to the character offsets of the match in `text`. */
  matches: Map<Id, TreeNodeMatchRange>;
};

/**
 * Resolve which rows stay visible for a filter term, using the same
 * case-insensitive substring match on `text` as `filterTreeByText`. An empty or
 * whitespace-only `filterText` means "no filter" and returns empty sets.
 */
export function matchTreeNodes<T extends NodeLike>(
  nodes: readonly T[],
  filterText: string,
): TreeNodeMatches<T["id"]>;

export default matchTreeNodes;
