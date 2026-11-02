// @ts-check
import { isQueryGroup } from "./query.js";

/**
 * @typedef {import("./QueryBuilder.svelte").QueryCondition} QueryCondition
 * @typedef {import("./QueryBuilder.svelte").QueryGroup} QueryGroup
 * @typedef {QueryCondition | QueryGroup} QueryNode
 */

/**
 * Whether every node of the tree has an `id`.
 * @param {QueryGroup} group
 * @returns {boolean}
 */
export function hasIds(group) {
  if (group.id == null) return false;
  return group.conditions.every((node) =>
    isQueryGroup(node) ? hasIds(node) : node.id != null,
  );
}

/**
 * Give every node an id, keeping the ones it has. Nodes that already carry
 * ids (and all their descendants) are returned as they are, so an unchanged
 * branch keeps its identity. New ids come from `makeId` and never repeat an
 * id already in the tree.
 * @param {QueryGroup} group
 * @param {() => string} makeId
 * @returns {QueryGroup}
 */
export function assignIds(group, makeId) {
  /** @type {Set<string>} */
  const taken = new Set();
  /** @param {QueryGroup} node */
  function collect(node) {
    if (node.id != null) taken.add(node.id);
    for (const child of node.conditions) {
      if (isQueryGroup(child)) collect(child);
      else if (child.id != null) taken.add(child.id);
    }
  }
  collect(group);

  function freshId() {
    let id = makeId();
    while (taken.has(id)) id = makeId();
    taken.add(id);
    return id;
  }

  /**
   * @template {QueryNode} Node
   * @param {Node} node
   * @returns {Node}
   */
  function visit(node) {
    if (isQueryGroup(node)) {
      let changed = node.id == null;
      const conditions = node.conditions.map((child) => {
        const next = visit(child);
        if (next !== child) changed = true;
        return next;
      });
      if (!changed) return node;
      return /** @type {Node} */ ({
        ...node,
        id: node.id ?? freshId(),
        conditions,
      });
    }
    return node.id == null
      ? /** @type {Node} */ ({ ...node, id: freshId() })
      : node;
  }

  return visit(group);
}

/**
 * @typedef {object} Found
 * @property {QueryNode} node
 * @property {QueryGroup | null} parent
 * @property {number} index
 * @property {number} depth - 1 for the root's children's group level
 */

/**
 * @param {QueryGroup} root
 * @param {string} id
 * @returns {Found | null}
 */
export function findNode(root, id) {
  if (root.id === id) return { node: root, parent: null, index: -1, depth: 1 };

  /**
   * @param {QueryGroup} group
   * @param {number} depth
   * @returns {Found | null}
   */
  function search(group, depth) {
    for (let index = 0; index < group.conditions.length; index++) {
      const node = group.conditions[index];
      if (node.id === id) return { node, parent: group, index, depth };
      if (isQueryGroup(node)) {
        const found = search(node, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  return search(root, 1);
}

/**
 * Rebuild the path from the root to the group `id`, applying `change` to
 * that group. Every other branch keeps its identity.
 * @param {QueryGroup} root
 * @param {string} id
 * @param {(group: QueryGroup) => QueryGroup} change
 * @returns {QueryGroup}
 */
function changeGroup(root, id, change) {
  if (root.id === id) return change(root);
  let touched = false;
  const conditions = root.conditions.map((node) => {
    if (!isQueryGroup(node)) return node;
    const next = changeGroup(node, id, change);
    if (next !== node) touched = true;
    return next;
  });
  return touched ? { ...root, conditions } : root;
}

/**
 * Merge `patch` into the node `id`.
 * @param {QueryGroup} root
 * @param {string} id
 * @param {Record<string, unknown>} patch
 * @returns {QueryGroup}
 */
export function updateNode(root, id, patch) {
  if (root.id === id) return { ...root, ...patch };
  const found = findNode(root, id);
  if (!found?.parent) return root;
  const { parent, index } = found;
  return changeGroup(root, /** @type {string} */ (parent.id), (group) => ({
    ...group,
    conditions: group.conditions.map((node, at) =>
      at === index ? /** @type {QueryNode} */ ({ ...node, ...patch }) : node,
    ),
  }));
}

/**
 * Append `node` to the group `groupId`.
 * @param {QueryGroup} root
 * @param {string} groupId
 * @param {QueryNode} node
 * @returns {QueryGroup}
 */
export function appendNode(root, groupId, node) {
  return changeGroup(root, groupId, (group) => ({
    ...group,
    conditions: [...group.conditions, node],
  }));
}

/**
 * Drop the node `id`. The root cannot be removed.
 * @param {QueryGroup} root
 * @param {string} id
 * @returns {QueryGroup}
 */
export function removeNode(root, id) {
  const found = findNode(root, id);
  if (!found?.parent) return root;
  const { parent, index } = found;
  return changeGroup(root, /** @type {string} */ (parent.id), (group) => ({
    ...group,
    conditions: group.conditions.filter((_, at) => at !== index),
  }));
}

/**
 * Move the node `id` by `delta` places within its group, stopping at the
 * ends.
 * @param {QueryGroup} root
 * @param {string} id
 * @param {number} delta
 * @returns {QueryGroup}
 */
export function moveNode(root, id, delta) {
  const found = findNode(root, id);
  if (!found?.parent) return root;
  const { parent, index } = found;
  const target = Math.min(
    Math.max(index + delta, 0),
    parent.conditions.length - 1,
  );
  if (target === index) return root;
  return changeGroup(root, /** @type {string} */ (parent.id), (group) => {
    const conditions = [...group.conditions];
    const [moved] = conditions.splice(index, 1);
    conditions.splice(target, 0, moved);
    return { ...group, conditions };
  });
}
