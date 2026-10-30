// @ts-check
/**
 * Pure helpers behind `TreeSelect`: the menu is a flat array of visible rows
 * (so a window, a highlight index and type-ahead are all array math), built
 * from the nested `nodes` the consumer supplies.
 */

/**
 * @typedef {string | number} TreeSelectNodeId
 */

/**
 * @typedef {Object} TreeSelectBaseNode
 * @property {TreeSelectNodeId} id
 * @property {boolean} [disabled]
 * @property {boolean} [hasChildren]
 * @property {TreeSelectBaseNode[]} [nodes]
 */

/**
 * @template {{ id: TreeSelectNodeId; disabled?: boolean; hasChildren?: boolean; nodes?: T[] }} T
 * @typedef {Object} TreeSelectRow
 * @property {T} node
 * @property {number} depth - Zero-based nesting depth
 * @property {TreeSelectNodeId | null} parentId
 * @property {number} posInSet - One-based position among siblings
 * @property {number} setSize - Number of siblings
 * @property {boolean} expandable - Has loaded children, or is a lazy parent
 * @property {boolean} expanded
 */

/**
 * Id lookups for the whole tree.
 *
 * `ordinalById` numbers nodes in document order. A DOM id built from a node
 * id breaks `aria-activedescendant` when the id holds a space, so rows are
 * addressed by ordinal instead.
 *
 * @template {{ id: TreeSelectNodeId; disabled?: boolean; hasChildren?: boolean; nodes?: T[] }} T
 * @param {ReadonlyArray<T>} nodes
 * @returns {{
 *   byId: Map<TreeSelectNodeId, T>,
 *   parentById: Map<TreeSelectNodeId, TreeSelectNodeId | null>,
 *   ordinalById: Map<TreeSelectNodeId, number>,
 * }}
 */
export function indexTree(nodes) {
  /** @type {Map<TreeSelectNodeId, T>} */
  const byId = new Map();
  /** @type {Map<TreeSelectNodeId, TreeSelectNodeId | null>} */
  const parentById = new Map();
  /** @type {Map<TreeSelectNodeId, number>} */
  const ordinalById = new Map();

  /** @type {Array<{ list: ReadonlyArray<T>; index: number; parentId: TreeSelectNodeId | null }>} */
  const stack = [{ list: nodes, index: 0, parentId: null }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.list.length) {
      stack.pop();
      continue;
    }
    const node = frame.list[frame.index++];
    byId.set(node.id, node);
    parentById.set(node.id, frame.parentId);
    ordinalById.set(node.id, ordinalById.size);
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      stack.push({
        list: node.nodes,
        index: 0,
        parentId: node.id,
      });
    }
  }

  return { byId, parentById, ordinalById };
}

/**
 * Ids of every node in `nodes` that has loaded children.
 * Searching expands exactly these, so each match shows under its ancestors.
 *
 * @param {ReadonlyArray<TreeSelectBaseNode>} nodes
 * @returns {Set<TreeSelectNodeId>}
 */
export function expandableIds(nodes) {
  /** @type {Set<TreeSelectNodeId>} */
  const ids = new Set();
  /** @type {TreeSelectBaseNode[]} */
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = /** @type {TreeSelectBaseNode} */ (stack.pop());
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      ids.add(node.id);
      for (const child of node.nodes) stack.push(child);
    }
  }
  return ids;
}

/**
 * The rows the menu shows: every node whose ancestors are all expanded, in
 * document order. Rebuilt when the tree or the expansion changes, never for
 * a check.
 *
 * @template {{ id: TreeSelectNodeId; disabled?: boolean; hasChildren?: boolean; nodes?: T[] }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {ReadonlySet<TreeSelectNodeId>} expanded
 * @returns {Array<TreeSelectRow<T>>}
 */
export function flattenVisible(nodes, expanded) {
  /** @type {Array<TreeSelectRow<T>>} */
  const rows = [];
  /** @type {Array<{ list: ReadonlyArray<T>; index: number; depth: number; parentId: TreeSelectNodeId | null }>} */
  const stack = [{ list: nodes, index: 0, depth: 0, parentId: null }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.list.length) {
      stack.pop();
      continue;
    }
    const position = frame.index++;
    const node = frame.list[position];
    const children = node.nodes;
    const loaded = Array.isArray(children) && children.length > 0;
    const expandable = loaded || node.hasChildren === true;
    rows.push({
      node,
      depth: frame.depth,
      parentId: frame.parentId,
      posInSet: position + 1,
      setSize: frame.list.length,
      expandable,
      expanded: expandable && expanded.has(node.id),
    });
    if (loaded && expanded.has(node.id)) {
      stack.push({
        list: children,
        index: 0,
        depth: frame.depth + 1,
        parentId: node.id,
      });
    }
  }

  return rows;
}

/**
 * Overlay lazily loaded children onto the consumer's tree without mutating
 * it. A node that already carries `nodes` keeps them. Returns `nodes`
 * itself when nothing has loaded, so an unrelated update costs nothing.
 *
 * @template {{ id: TreeSelectNodeId; disabled?: boolean; hasChildren?: boolean; nodes?: T[] }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {ReadonlyMap<TreeSelectNodeId, ReadonlyArray<T>>} loaded
 * @returns {ReadonlyArray<T>}
 */
export function withLoadedChildren(nodes, loaded) {
  if (loaded.size === 0) return nodes;

  /**
   * @param {ReadonlyArray<T>} list
   * @returns {ReadonlyArray<T>}
   */
  function overlay(list) {
    let changed = false;
    const next = list.map((node) => {
      const own = Array.isArray(node.nodes) && node.nodes.length > 0;
      const fetched = own ? undefined : loaded.get(node.id);
      const children =
        fetched ?? /** @type {ReadonlyArray<T> | undefined} */ (node.nodes);
      if (!children || children.length === 0) {
        if (!fetched) return node;
        changed = true;
        return { ...node, nodes: [], hasChildren: false };
      }
      const nextChildren = overlay(children);
      if (nextChildren === children && !fetched) return node;
      changed = true;
      return { ...node, nodes: [...nextChildren] };
    });
    return changed ? next : list;
  }

  return overlay(nodes);
}

/**
 * Which checked ids the field reports: as tags or text, and as form values.
 *
 * - `"all"`: every checked id.
 * - `"parent"`: the topmost checked node of each subtree, so a fully
 *   checked branch reads as one entry.
 * - `"leaf"`: only checked nodes without loaded children.
 *
 * @param {ReadonlyArray<TreeSelectNodeId>} checkedIds
 * @param {"all" | "parent" | "leaf"} strategy
 * @param {{
 *   byId: ReadonlyMap<TreeSelectNodeId, TreeSelectBaseNode>,
 *   parentById: ReadonlyMap<TreeSelectNodeId, TreeSelectNodeId | null>,
 * }} index
 * @returns {Array<TreeSelectNodeId>}
 */
export function shownCheckedIds(checkedIds, strategy, index) {
  if (strategy === "all") return [...checkedIds];
  if (strategy === "leaf") {
    return checkedIds.filter((id) => {
      const node = index.byId.get(id);
      return !(node && Array.isArray(node.nodes) && node.nodes.length > 0);
    });
  }
  const checked = new Set(checkedIds);
  return checkedIds.filter((id) => {
    const parentId = index.parentById.get(id);
    return parentId == null || !checked.has(parentId);
  });
}

/**
 * Whether two id lists hold the same ids in the same order.
 *
 * @param {ReadonlyArray<TreeSelectNodeId>} a
 * @param {ReadonlyArray<TreeSelectNodeId>} b
 * @returns {boolean}
 */
export function sameIds(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Ids in `next` missing from `prev`, and ids in `prev` missing from `next`.
 *
 * @param {ReadonlyArray<TreeSelectNodeId>} prev
 * @param {ReadonlyArray<TreeSelectNodeId>} next
 * @returns {{ added: Array<TreeSelectNodeId>, removed: Array<TreeSelectNodeId> }}
 */
export function diffIds(prev, next) {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((id) => !prevSet.has(id)),
    removed: prev.filter((id) => !nextSet.has(id)),
  };
}

/**
 * Ids that match no node while some lazy parent has not loaded its
 * children. Such an id may name a node that is not loaded yet, so the
 * component keeps it instead of dropping it. In a tree with no unloaded
 * parent, an unknown id is stale and none are returned.
 *
 * @param {ReadonlyArray<TreeSelectNodeId>} ids
 * @param {{ byId: ReadonlyMap<TreeSelectNodeId, TreeSelectBaseNode> }} index
 * @returns {Array<TreeSelectNodeId>}
 */
export function unresolvedIds(ids, index) {
  const unknown = ids.filter((id) => !index.byId.has(id));
  if (unknown.length === 0) return unknown;
  for (const node of index.byId.values()) {
    if (node.hasChildren === true && !(node.nodes && node.nodes.length > 0)) {
      return unknown;
    }
  }
  return [];
}
