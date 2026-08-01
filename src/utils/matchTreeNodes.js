// @ts-check
/**
 * @typedef {Object} TreeNode
 * @property {string | number} id
 * @property {any} [text]
 * @property {TreeNode[]} [nodes]
 */

/**
 * @typedef {Object} TreeNodeMatches
 * @property {Set<string | number>} matchedIds - Nodes whose own `text` matches.
 * @property {Set<string | number>} ancestorIds - Nodes visible only because a descendant matched.
 * @property {Set<string | number>} visibleIds - Every node that stays visible: the matches, their ancestors, and the descendants of a matching node.
 * @property {Map<string | number, [number, number]>} matches - Matched node id to the `[start, end]` character offsets of the match in `text`.
 */

/**
 * Character offsets of the first case-insensitive occurrence of `needle`.
 * Returns `null` when `text` is not a string or does not contain `needle`.
 * @param {any} text
 * @param {string} needle - Already lowercased search term.
 * @returns {[number, number] | null}
 */
function matchRange(text, needle) {
  if (typeof text !== "string") return null;
  const start = text.toLowerCase().indexOf(needle);
  if (start === -1) return null;
  return [start, start + needle.length];
}

/**
 * Resolve which rows stay visible for a filter term, without allocating a new
 * tree. Matching is a case-insensitive substring test on `node.text`, the same
 * semantics as `filterTreeByText`. Surrounding whitespace in `filterText` is
 * ignored; an empty or whitespace-only term means "no filter" and returns
 * empty sets.
 * @param {TreeNode[]} nodes - Hierarchical tree structure to search
 * @param {string} filterText - Text to search for (case-insensitive)
 * @returns {TreeNodeMatches}
 */
export function matchTreeNodes(nodes, filterText) {
  /** @type {TreeNodeMatches} */
  const result = {
    matchedIds: new Set(),
    ancestorIds: new Set(),
    visibleIds: new Set(),
    matches: new Map(),
  };

  const needle = (filterText ?? "").trim().toLowerCase();
  if (needle === "") return result;

  /**
   * @param {TreeNode} node
   * @param {boolean} isUnderMatch - Whether an ancestor of `node` matched.
   * @returns {boolean} Whether `node` or one of its descendants matched.
   */
  function visit(node, isUnderMatch) {
    const range = matchRange(node.text, needle);
    const isMatch = range !== null;

    if (range !== null) {
      result.matchedIds.add(node.id);
      result.matches.set(node.id, range);
    }

    let hasMatchInSubtree = isMatch;

    if (Array.isArray(node.nodes)) {
      for (const child of node.nodes) {
        if (visit(child, isUnderMatch || isMatch)) hasMatchInSubtree = true;
      }
    }

    if (isMatch || isUnderMatch) {
      result.visibleIds.add(node.id);
    } else if (hasMatchInSubtree) {
      result.ancestorIds.add(node.id);
      result.visibleIds.add(node.id);
    }

    return hasMatchInSubtree;
  }

  for (const node of nodes) {
    visit(node, false);
  }

  return result;
}

export default matchTreeNodes;
