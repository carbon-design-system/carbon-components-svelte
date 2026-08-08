// @ts-check
/**
 * @typedef {string | number} TreeCheckboxNodeId
 */

/**
 * @typedef {Object} TreeCheckboxNode
 * @property {TreeCheckboxNodeId} id
 * @property {boolean} [disabled]
 * @property {TreeCheckboxNode[]} [nodes]
 */

/**
 * @typedef {Object} TreeCheckboxOptions
 * @property {boolean} [conduct] - Propagate checks to descendants and derive ancestor state
 */

/**
 * @typedef {Object} TreeCheckboxState
 * @property {Array<TreeCheckboxNodeId>} selectedIds
 * @property {Array<TreeCheckboxNodeId>} indeterminateIds
 */

/**
 * Visit every node in document (depth-first, pre-order) order.
 * @param {ReadonlyArray<TreeCheckboxNode>} nodes
 * @param {(node: TreeCheckboxNode) => void} visitor
 * @returns {void}
 */
function visit(nodes, visitor) {
  for (const node of nodes) {
    visitor(node);
    if (Array.isArray(node.nodes)) visit(node.nodes, visitor);
  }
}

/**
 * Ids of `node` and every non-disabled descendant. A disabled node prunes its
 * whole subtree, matching how a disabled node blocks multiselect expansion.
 * @param {TreeCheckboxNode} node
 * @returns {Array<TreeCheckboxNodeId>}
 */
function conductibleIds(node) {
  /** @type {Array<TreeCheckboxNodeId>} */
  const ids = [];

  /** @param {TreeCheckboxNode} current */
  function walk(current) {
    if (current.disabled) return;
    ids.push(current.id);
    if (!Array.isArray(current.nodes)) return;
    for (const child of current.nodes) walk(child);
  }

  walk(node);
  return ids;
}

/**
 * Ids of `node` and every descendant, disabled ones included.
 * @param {TreeCheckboxNode} node
 * @returns {Array<TreeCheckboxNodeId>}
 */
function subtreeIds(node) {
  /** @type {Array<TreeCheckboxNodeId>} */
  const ids = [];
  visit([node], (current) => ids.push(current.id));
  return ids;
}

/**
 * Nodes from a root down to the node matching `id`, or `null` if no node matches.
 * @param {ReadonlyArray<TreeCheckboxNode>} nodes
 * @param {TreeCheckboxNodeId} id
 * @returns {Array<TreeCheckboxNode> | null}
 */
function findPath(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return [node];
    if (!Array.isArray(node.nodes)) continue;
    const path = findPath(node.nodes, id);
    if (path) {
      path.unshift(node);
      return path;
    }
  }
  return null;
}

/**
 * Ids the consumer set, minus duplicates and ids with no matching node.
 * @param {ReadonlyArray<TreeCheckboxNode>} nodes
 * @param {ReadonlyArray<TreeCheckboxNodeId>} selectedIds
 * @returns {Array<TreeCheckboxNodeId>}
 */
function retainKnownIds(nodes, selectedIds) {
  /** @type {Set<TreeCheckboxNodeId>} */
  const knownIds = new Set();
  visit(nodes, (node) => knownIds.add(node.id));

  /** @type {Array<TreeCheckboxNodeId>} */
  const retained = [];
  /** @type {Set<TreeCheckboxNodeId>} */
  const seen = new Set();
  for (const id of selectedIds) {
    if (knownIds.has(id) && !seen.has(id)) {
      seen.add(id);
      retained.push(id);
    }
  }
  return retained;
}

/**
 * Derive the full check state of a tree from a set of selected ids.
 *
 * With `conduct`, a selected node checks every non-disabled descendant, a node
 * is selected when all of its conductible children are, and indeterminate when
 * only some are. Disabled nodes and their subtrees are excluded from the result
 * and from their ancestors' state. Ids with no matching node are dropped.
 *
 * With `conduct: false`, the selection is passed through untouched and nothing
 * is indeterminate.
 * @param {ReadonlyArray<TreeCheckboxNode>} nodes
 * @param {ReadonlyArray<TreeCheckboxNodeId>} selectedIds
 * @param {TreeCheckboxOptions} [options]
 * @returns {TreeCheckboxState} Selected and indeterminate ids, in document order
 */
export function resolveCheckboxState(nodes, selectedIds, options = {}) {
  const { conduct = true } = options;

  if (!conduct) {
    return {
      selectedIds: retainKnownIds(nodes, selectedIds),
      indeterminateIds: [],
    };
  }

  const seed = new Set(selectedIds);
  /** @type {Set<TreeCheckboxNodeId>} */
  const selected = new Set();
  /** @type {Set<TreeCheckboxNodeId>} */
  const indeterminate = new Set();

  /**
   * @param {TreeCheckboxNode} node
   * @param {boolean} inherited - Whether an ancestor conducted a check down to `node`
   * @returns {{ selected: boolean; indeterminate: boolean } | null} `null` when the node is pruned
   */
  function walk(node, inherited) {
    if (node.disabled) return null;

    const isChecked = inherited || seed.has(node.id);
    const children = Array.isArray(node.nodes) ? node.nodes : [];
    /** @type {Array<{ selected: boolean; indeterminate: boolean }>} */
    const results = [];

    for (const child of children) {
      const result = walk(child, isChecked);
      if (result) results.push(result);
    }

    // A node with no conductible children resolves on its own, so a parent
    // whose children are all disabled behaves like a leaf.
    if (results.length === 0) {
      if (isChecked) selected.add(node.id);
      return { selected: isChecked, indeterminate: false };
    }

    if (results.every((result) => result.selected)) {
      selected.add(node.id);
      return { selected: true, indeterminate: false };
    }

    if (results.some((result) => result.selected || result.indeterminate)) {
      indeterminate.add(node.id);
      return { selected: false, indeterminate: true };
    }

    return { selected: false, indeterminate: false };
  }

  for (const node of nodes) walk(node, false);

  /** @type {Array<TreeCheckboxNodeId>} */
  const nextSelectedIds = [];
  /** @type {Array<TreeCheckboxNodeId>} */
  const nextIndeterminateIds = [];
  visit(nodes, (node) => {
    if (selected.has(node.id)) nextSelectedIds.push(node.id);
    if (indeterminate.has(node.id)) nextIndeterminateIds.push(node.id);
  });

  return {
    selectedIds: nextSelectedIds,
    indeterminateIds: nextIndeterminateIds,
  };
}

/**
 * Next selection after checking or unchecking one node.
 *
 * With `conduct`, checking a node checks its non-disabled descendants and
 * unchecking one clears its subtree along with every ancestor, so the ancestors
 * fall back to indeterminate. Without it, only `id` changes.
 * @param {ReadonlyArray<TreeCheckboxNode>} nodes
 * @param {ReadonlyArray<TreeCheckboxNodeId>} selectedIds
 * @param {TreeCheckboxNodeId} id - The node the user checked or unchecked
 * @param {boolean} checked - The node's state after the gesture
 * @param {TreeCheckboxOptions} [options]
 * @returns {Array<TreeCheckboxNodeId>}
 */
export function toggleCheckboxNode(
  nodes,
  selectedIds,
  id,
  checked,
  options = {},
) {
  const { conduct = true } = options;
  const next = new Set(selectedIds);

  if (!conduct) {
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    return resolveCheckboxState(nodes, Array.from(next), options).selectedIds;
  }

  const path = findPath(nodes, id);
  const node = path?.[path.length - 1];

  if (node && !node.disabled) {
    if (checked) {
      for (const descendantId of conductibleIds(node)) next.add(descendantId);
    } else {
      for (const descendantId of subtreeIds(node)) next.delete(descendantId);
      for (const ancestor of path.slice(0, -1)) next.delete(ancestor.id);
    }
  }

  return resolveCheckboxState(nodes, Array.from(next), options).selectedIds;
}
