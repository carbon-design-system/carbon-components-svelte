type TreeDragNodeId = string | number;

/** Drop position for a dragover point within a hovered row, split into top/middle/bottom thirds. */
export function computeDropPosition(
  clientY: number,
  rect: { top: number; height: number },
): "before" | "after" | "inside";

/** Whether `id` is a descendant of `ancestorId`, walking up via `parentIdById`. */
export function isDescendant<Id extends TreeDragNodeId>(
  id: Id,
  ancestorId: Id,
  parentIdById: Map<Id, Id | symbol>,
): boolean;

/**
 * Whether dropping `draggedId` onto `targetId` is a legal move: not the
 * dragged node itself, and not one of its own descendants.
 */
export function isValidDropTarget<Id extends TreeDragNodeId>(
  draggedId: Id,
  targetId: Id,
  parentIdById: Map<Id, Id | symbol>,
): boolean;
