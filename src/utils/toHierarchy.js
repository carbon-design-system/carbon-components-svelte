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
  const nodeMap = new Map();

  for (const item of flatArray) {
    const parentId = getParentId(item);
    nodeMap.set(item.id, item);

    if (!parentId || !nodeMap.has(parentId)) {
      tree.push(item);
    } else {
      const parent = nodeMap.get(parentId);
      if (!parent.nodes) {
        parent.nodes = [];
      }
      parent.nodes.push(item);
    }
  }

  return tree;
}

export default toHierarchy;
