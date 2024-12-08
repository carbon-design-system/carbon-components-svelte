// @ts-check
/**
 * Create a nested array from a flat array.
 * @typedef {Object} NodeLike
 * @property {string | number} id - Unique identifier for the node
 * @property {NodeLike[]} [nodes] - Optional array of child nodes
 * @property {Record<string, any>} [additionalProperties] - Any additional properties
 *
 * @param {NodeLike[]} flatArray - Array of flat nodes to convert
 * @param {function(NodeLike): (string|number|null)} getParentId - Function to get parent ID for a node
 * @returns {NodeLike[]} Hierarchical tree structure
 */
export function toHierarchy(flatArray, getParentId) {
  /** @type {NodeLike[]} */
  const tree = [];

  // Use Map for O(1) lookups.
  const childrenOf = new Map();

  flatArray.forEach((item) => {
    const parentId = getParentId(item);

    // Only create nodes array if we have children
    const children = childrenOf.get(item.id);
    if (children) {
      item.nodes = children;
    }

    // Check if parentId exists in the flatArray.
    const parentExists = parentId && flatArray.some((p) => p.id === parentId);

    if (parentId && parentExists) {
      if (!childrenOf.has(parentId)) {
        childrenOf.set(parentId, []);
      }
      childrenOf.get(parentId).push(item);

      // If parent already processed, add nodes array.
      const parent = flatArray.find((p) => p.id === parentId);
      if (parent) {
        parent.nodes = childrenOf.get(parentId);
      }
    } else {
      tree.push(item);
    }
  });

  return tree;
}

export default toHierarchy;
