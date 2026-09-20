// @ts-check

/**
 * @typedef {string | number} TreeDragNodeId
 */

/**
 * Drop position for a dragover point within a hovered row, split into
 * top/middle/bottom thirds.
 * @param {number} clientY - Pointer Y position from the drag event.
 * @param {{ top: number, height: number }} rect - The hovered row's bounding rect.
 * @returns {"before" | "after" | "inside"}
 */
export function computeDropPosition(clientY, rect) {
  const offset = clientY - rect.top;
  const third = rect.height / 3;
  if (offset < third) return "before";
  if (offset > third * 2) return "after";
  return "inside";
}

/**
 * Whether `id` is a descendant of `ancestorId`, walking up via `parentIdById`
 * (TreeView's parent-id cache; the sentinel root parent id never matches a
 * real node id, so top-level nodes correctly resolve to `false`).
 * @param {TreeDragNodeId} id
 * @param {TreeDragNodeId} ancestorId
 * @param {Map<TreeDragNodeId, TreeDragNodeId | symbol>} parentIdById
 * @returns {boolean}
 */
export function isDescendant(id, ancestorId, parentIdById) {
  let parentId = parentIdById.get(id);
  while (parentId != null) {
    if (parentId === ancestorId) return true;
    parentId = parentIdById.get(/** @type {TreeDragNodeId} */ (parentId));
  }
  return false;
}

/**
 * Whether dropping `draggedId` onto `targetId` is a legal move: not the
 * dragged node itself, and not one of its own descendants (which would
 * reparent a node into its own subtree).
 * @param {TreeDragNodeId} draggedId
 * @param {TreeDragNodeId} targetId
 * @param {Map<TreeDragNodeId, TreeDragNodeId | symbol>} parentIdById
 * @returns {boolean}
 */
export function isValidDropTarget(draggedId, targetId, parentIdById) {
  if (draggedId === targetId) return false;
  return !isDescendant(targetId, draggedId, parentIdById);
}
