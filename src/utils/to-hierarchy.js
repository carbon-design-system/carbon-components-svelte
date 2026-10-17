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
  // Build on copies, so a rerun on the same items starts clean and frozen
  // items work. Each copy drops any `nodes` left over from earlier input.
  /** @type {NodeLike[]} */
  const copies = flatArray.map(({ nodes: _, ...item }) => item);
  const byId = new Map(copies.map((copy) => [copy.id, copy]));

  for (let index = 0; index < flatArray.length; index++) {
    const copy = copies[index];
    const parentId = getParentId(flatArray[index]);
    // Check for null, not falsiness: `0` and `""` are valid ids.
    const parent = parentId == null ? undefined : byId.get(parentId);

    if (parent) {
      if (!parent.nodes) parent.nodes = [];
      parent.nodes.push(copy);
    } else {
      tree.push(copy);
    }
  }

  return tree;
}
