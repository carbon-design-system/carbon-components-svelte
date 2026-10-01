// @ts-check

/**
 * @typedef {Object} MoveTreeNodeOptions
 * @property {string | number} target - Id of the node to move next to or into
 * @property {"before" | "after" | "inside"} position - Where to place the moved
 *   nodes: as the target's previous or next siblings, or as its last children
 */

/**
 * Move one or more nodes to a new place in a tree, returning a new tree.
 * Moved nodes keep their tree order and their own children. When both a node
 * and one of its descendants are listed, the descendant moves with its
 * ancestor.
 *
 * Only arrays on the changed paths are copied; untouched subtrees keep their
 * object references.
 *
 * Returns `tree` itself, unchanged, when the move is invalid: an unknown id
 * or target, or a target that is one of the moved nodes or inside one.
 * Compare the result with `tree` to detect that.
 *
 * @template {{ id: string | number; nodes?: ReadonlyArray<any> }} T
 * @param {ReadonlyArray<T>} tree - Hierarchical tree structure
 * @param {T["id"] | ReadonlyArray<T["id"]>} ids - Id or ids of the nodes to move
 * @param {MoveTreeNodeOptions} options
 * @returns {ReadonlyArray<T>}
 */
export function moveTreeNode(tree, ids, options) {
  const { target, position } = options;
  const movedIds = new Set(Array.isArray(ids) ? ids : [ids]);
  if (movedIds.size === 0) return tree;

  // Validate in one walk: every moved id exists, and the target exists
  // outside every moved subtree.
  const found = new Set();
  let targetFound = false;
  let targetInsideMoved = false;

  /**
   * @param {ReadonlyArray<T>} list
   * @param {boolean} insideMoved
   */
  function scan(list, insideMoved) {
    for (const node of list) {
      const moved = movedIds.has(node.id);
      if (moved) found.add(node.id);
      if (node.id === target) {
        targetFound = true;
        targetInsideMoved = insideMoved || moved;
      }
      if (Array.isArray(node.nodes)) {
        scan(node.nodes, insideMoved || moved);
      }
    }
  }
  scan(tree, false);

  if (!targetFound || targetInsideMoved || found.size !== movedIds.size) {
    return tree;
  }

  /** Top-most moved nodes, in tree order. @type {T[]} */
  const extracted = [];

  /**
   * Remove the top-most moved nodes. Returns the same array when nothing
   * under `list` was removed.
   * @param {ReadonlyArray<T>} list
   * @returns {ReadonlyArray<T>}
   */
  function remove(list) {
    /** @type {T[] | null} */
    let out = null;
    for (let i = 0; i < list.length; i++) {
      const node = list[i];
      if (movedIds.has(node.id)) {
        extracted.push(node);
        out ??= list.slice(0, i);
        continue;
      }
      let next = node;
      if (Array.isArray(node.nodes)) {
        const original = node.nodes;
        const children = remove(original);
        if (children !== original) next = { ...node, nodes: children };
      }
      if (out) out.push(next);
      else if (next !== node) {
        out = list.slice(0, i);
        out.push(next);
      }
    }
    return out ?? list;
  }

  /**
   * Insert the extracted nodes relative to the target.
   * @param {ReadonlyArray<T>} list
   * @returns {ReadonlyArray<T>}
   */
  function insert(list) {
    const index = list.findIndex((node) => node.id === target);
    if (index !== -1) {
      const out = list.slice();
      if (position === "inside") {
        const node = list[index];
        const children = Array.isArray(node.nodes) ? node.nodes : [];
        out[index] = { ...node, nodes: [...children, ...extracted] };
      } else {
        const at = position === "before" ? index : index + 1;
        out.splice(at, 0, ...extracted);
      }
      return out;
    }
    for (let i = 0; i < list.length; i++) {
      const node = list[i];
      if (!Array.isArray(node.nodes)) continue;
      const original = node.nodes;
      const children = insert(original);
      if (children !== original) {
        const out = list.slice();
        out[i] = { ...node, nodes: children };
        return out;
      }
    }
    return list;
  }

  return insert(remove(tree));
}
