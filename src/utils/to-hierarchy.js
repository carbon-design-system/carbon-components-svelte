// @ts-check
/**
 * @typedef {Object} NodeLike
 * @property {string | number} id
 * @property {NodeLike[]} [nodes]
 */

/**
 * Create a nested array from a flat array.
 * @param {NodeLike[]} flatArray - Array of flat nodes to convert
 * @param {(node: NodeLike) => string | number | null} getParentId - Function to get parent ID for a node
 * @returns {NodeLike[]} Hierarchical tree structure
 */
export function toHierarchy(flatArray, getParentId) {
  /** @type {NodeLike[]} */
  const tree = [];
  const childrenOf = new Map();
  const itemsMap = new Map(flatArray.map((item) => [item.id, item]));

  for (const item of flatArray) {
    const parentId = getParentId(item);

    const children = childrenOf.get(item.id);
    if (children) {
      item.nodes = children;
    }

    const parentExists = parentId && itemsMap.has(parentId);

    if (parentId && parentExists) {
      if (!childrenOf.has(parentId)) {
        childrenOf.set(parentId, []);
      }
      /** @type {NodeLike[]} */ (childrenOf.get(parentId)).push(item);

      const parent = itemsMap.get(parentId);
      if (parent) {
        parent.nodes = childrenOf.get(parentId);
      }
    } else {
      tree.push(item);
    }
  }

  return tree;
}

export default toHierarchy;
