// @ts-check
// Pure helpers over a `nodes` forest, shared by `TreeView` and
// `TreeViewGrid`. None of them touch the DOM.

/**
 * Sentinel parent id for top-level roots in the maps `buildTreeMaps`
 * returns. Symbol so it cannot collide with a real `Node["id"]`.
 */
export const ROOT_PARENT_ID = Symbol("tree-view-root-parent");

/**
 * Pre-order flatten of every node via an explicit stack.
 * @template {{ id: string | number; nodes?: TNode[] }} TNode
 * @param {ReadonlyArray<TNode>} nodes
 * @returns {Array<TNode>}
 */
export function traverse(nodes) {
  /** @type {TNode[]} */
  const out = [];
  /** @type {TNode[]} */
  const stack = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    stack.push(nodes[i]);
  }
  while (stack.length > 0) {
    const node = /** @type {TNode} */ (stack.pop());
    out.push(node);
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      for (let i = node.nodes.length - 1; i >= 0; i--) {
        stack.push(node.nodes[i]);
      }
    }
  }
  return out;
}

/**
 * Like `traverse`, but only into expanded nodes.
 * Used for Shift+Click range selection over visible rows.
 * @template {{ id: string | number; nodes?: TNode[] }} TNode
 * @param {ReadonlyArray<TNode>} nodes
 * @param {Set<string | number>} expandedIdsSet
 * @returns {Array<TNode>}
 */
export function traverseVisible(nodes, expandedIdsSet) {
  /** @type {TNode[]} */
  const out = [];
  /** @type {Array<{ list: ReadonlyArray<TNode>; index: number }>} */
  const stack = [{ list: nodes, index: 0 }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.list.length) {
      stack.pop();
      continue;
    }
    const node = frame.list[frame.index++];
    out.push(node);
    if (
      Array.isArray(node.nodes) &&
      node.nodes.length > 0 &&
      expandedIdsSet.has(node.id)
    ) {
      stack.push({ list: node.nodes, index: 0 });
    }
  }
  return out;
}

/**
 * Build node, parent, and child-id maps in one walk.
 * Leaves a flat array to `traverse`.
 * @template {{ id: string | number; nodes?: TNode[] }} TNode
 * @param {ReadonlyArray<TNode>} nodes
 * @returns {{
 *   nodeMap: Map<TNode["id"], TNode>,
 *   parentIdById: Map<TNode["id"], TNode["id"] | typeof ROOT_PARENT_ID>,
 *   childIdsByParentId: Map<TNode["id"] | typeof ROOT_PARENT_ID, Array<TNode["id"]>>,
 * }}
 */
export function buildTreeMaps(nodes) {
  /** @type {Map<TNode["id"], TNode>} */
  const nodeMap = new Map();
  /** @type {Map<TNode["id"], TNode["id"] | typeof ROOT_PARENT_ID>} */
  const parentIdById = new Map();
  /** @type {Map<TNode["id"] | typeof ROOT_PARENT_ID, Array<TNode["id"]>>} */
  const childIdsByParentId = new Map();

  /** @type {Array<TNode["id"]>} */
  const rootIds = [];
  for (const node of nodes) {
    rootIds.push(node.id);
  }
  childIdsByParentId.set(ROOT_PARENT_ID, rootIds);

  /** @type {Array<{ node: TNode; parentId: TNode["id"] | typeof ROOT_PARENT_ID }>} */
  const stack = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    stack.push({ node: nodes[i], parentId: ROOT_PARENT_ID });
  }
  while (stack.length > 0) {
    const { node, parentId } = /** @type {(typeof stack)[number]} */ (
      stack.pop()
    );
    nodeMap.set(node.id, node);
    parentIdById.set(node.id, parentId);
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      /** @type {Array<TNode["id"]>} */
      const childIds = [];
      for (const child of node.nodes) {
        childIds.push(child.id);
      }
      childIdsByParentId.set(node.id, childIds);
      for (let i = node.nodes.length - 1; i >= 0; i--) {
        stack.push({ node: node.nodes[i], parentId: node.id });
      }
    }
  }

  return { nodeMap, parentIdById, childIdsByParentId };
}

/**
 * Ancestor ids from forest root to the parent of `id`.
 * Omits `id`. Empty for top-level roots and unknown ids.
 * @template {string | number} Id
 * @param {Id} id
 * @param {Map<Id, Id | typeof ROOT_PARENT_ID> | null} parentIdById
 * @returns {Id[]}
 */
export function getAncestorIds(id, parentIdById) {
  if (!parentIdById) return [];
  /** @type {Id[]} */
  const ancestors = [];
  let parentId = parentIdById.get(id);
  while (parentId != null && parentId !== ROOT_PARENT_ID) {
    ancestors.push(/** @type {Id} */ (parentId));
    parentId = parentIdById.get(/** @type {Id} */ (parentId));
  }
  ancestors.reverse();
  return ancestors;
}

/**
 * IDs to select for multiselect expansion from `node` (non-disabled only).
 * Disabled nodes are omitted; subtrees under a disabled node are not traversed.
 * @template {{ id: string | number; disabled?: boolean; nodes?: TNode[] }} TNode
 * @param {TNode} node
 * @param {"node" | "shallow" | "deep"} mode
 * @returns {Array<string | number>}
 */
export function multiselectExpansionIds(node, mode) {
  if (node.disabled) return [];
  if (mode === "node") {
    return [node.id];
  }
  if (mode === "shallow") {
    const out = [node.id];
    if (!Array.isArray(node.nodes)) return out;
    for (const c of node.nodes) {
      if (!c.disabled) out.push(c.id);
    }
    return out;
  }
  /** @type {Array<string | number>} */
  const out = [];
  /** @param {TNode} n */
  function walkDeep(n) {
    if (n.disabled) return;
    out.push(n.id);
    if (!Array.isArray(n.nodes)) return;
    for (const c of n.nodes) walkDeep(c);
  }
  walkDeep(node);
  return out;
}
