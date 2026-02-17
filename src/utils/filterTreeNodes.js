// @ts-check
/**
 * Filter tree nodes by a predicate function.
 * Returns a new tree containing only matching nodes and their ancestors.
 *
 * @typedef {Object} TreeNode
 * @property {string | number} id - Unique identifier for the node
 * @property {string} [text] - Optional text/name for the node
 * @property {TreeNode[]} [nodes] - Optional array of child nodes
 * @property {Record<string, unknown>} [additionalProperties] - Any additional properties
 *
 * @typedef {Object} FilterOptions
 * @property {boolean} [includeChildren=false] - Include all descendants of matching nodes
 * @property {boolean} [includeAncestors=true] - Include all ancestors of matching nodes
 *
 * @param {TreeNode[]} tree - Hierarchical tree structure to filter
 * @param {function(TreeNode): boolean} predicate - Function to test each node
 * @param {FilterOptions} [options] - Filtering options
 * @returns {TreeNode[]} Filtered tree structure
 */
export function filterTreeNodes(
  tree,
  predicate,
  options = { includeChildren: false, includeAncestors: true },
) {
  const { includeChildren = false, includeAncestors = true } = options;

  /**
   * Deep clone a node and all its children
   * @param {TreeNode} node
   * @returns {TreeNode}
   */
  function cloneNode(node) {
    const cloned = { ...node };
    if (Array.isArray(node.nodes)) {
      cloned.nodes = node.nodes.map(cloneNode);
    }
    return cloned;
  }

  /**
   * Recursively filter tree nodes
   * @param {TreeNode} node
   * @returns {{ node: TreeNode | null, hasMatch: boolean }}
   */
  function filterNode(node) {
    const matches = predicate(node);

    // Process children first
    const filteredChildren = [];
    let childHasMatch = false;

    if (Array.isArray(node.nodes)) {
      for (const child of node.nodes) {
        const result = filterNode(child);
        if (result.node) {
          filteredChildren.push(result.node);
          childHasMatch = true;
        }
      }
    }

    // If this node matches and we include children, use all original children
    if (matches && includeChildren) {
      return { node: cloneNode(node), hasMatch: true };
    }

    // Include this node if:
    // 1. It matches the predicate, OR
    // 2. includeAncestors is true AND a descendant matches
    if (matches || (includeAncestors && childHasMatch)) {
      const newNode = { ...node };
      if (filteredChildren.length > 0) {
        newNode.nodes = filteredChildren;
      } else if (matches && !includeChildren) {
        // If node matches but has no matching children, remove nodes array
        newNode.nodes = undefined;
      } else {
        // Remove empty nodes array when just including ancestors
        newNode.nodes = undefined;
      }
      return { node: newNode, hasMatch: true };
    }

    return { node: null, hasMatch: false };
  }

  const result = [];
  for (const node of tree) {
    const filtered = filterNode(node);
    if (filtered.node) {
      result.push(filtered.node);
    }
  }

  return result;
}

/**
 * Filter tree nodes by node ID
 * @param {TreeNode[]} tree - Hierarchical tree structure to filter
 * @param {string | number | (string | number)[]} id - Single ID or array of IDs to match
 * @param {FilterOptions} [options] - Filtering options
 * @returns {TreeNode[]} Filtered tree structure
 */
export function filterTreeById(tree, id, options) {
  const ids = Array.isArray(id) ? new Set(id) : new Set([id]);
  return filterTreeNodes(tree, (node) => ids.has(node.id), options);
}

/**
 * Filter tree nodes by text/name (case-insensitive substring match)
 * @param {TreeNode[]} tree - Hierarchical tree structure to filter
 * @param {string} text - Text to search for (case-insensitive)
 * @param {FilterOptions} [options] - Filtering options
 * @returns {TreeNode[]} Filtered tree structure
 */
export function filterTreeByText(tree, text, options) {
  const searchText = text.toLowerCase();
  return filterTreeNodes(
    tree,
    (node) => {
      const nodeText = node.text || "";
      return (
        typeof nodeText === "string" &&
        nodeText.toLowerCase().includes(searchText)
      );
    },
    options,
  );
}

export default filterTreeNodes;
