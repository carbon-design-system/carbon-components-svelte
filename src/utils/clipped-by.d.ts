/**
 * The first box that cuts `el` off: an ancestor whose overflow isn't
 * `visible` on an axis where `el` reaches past its edge, counting only
 * boxes that position `el`. `null` when nothing clips it or `el` has no
 * layout (zero size).
 */
export function clippedBy(el: HTMLElement): HTMLElement | null;
