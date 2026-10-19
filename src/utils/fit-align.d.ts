/**
 * Fits a popover, tooltip or menu to the boxes around it: the start or end
 * alignment that fits its container better, a slide back into the window,
 * or the box that cuts it off, so it can move to a portal.
 */

/**
 * The horizontal room a popover has: the nearest ancestor that clips or
 * scrolls on the x axis, such as a table's scroll container, within the
 * viewport.
 */
export function horizontalBounds(node: Element): {
  left: number;
  right: number;
};

/**
 * Whether a start- or end-aligned popover overflows `bounds` less on the
 * other side. Both alignments point the caret at the trigger's center, so
 * the other side is the popover mirrored around that center.
 */
export function shouldFlipAlign(
  popover: { left: number; right: number },
  center: number,
  bounds: { left: number; right: number },
): boolean;

/**
 * How far to slide `el` sideways so it sits at least `margin` px (8 by
 * default) inside the window, measured as if `applied` px weren't applied.
 * A box with no layout (zero size), or a window with none, keeps `applied`.
 */
export function windowShift(
  el: Element,
  applied: number,
  margin?: number,
): number;

/**
 * The first box that cuts `el` off: an ancestor whose overflow isn't
 * `visible` on an axis where `el` reaches past its edge, counting only
 * boxes that position `el`. `null` when nothing clips it or `el` has no
 * layout (zero size).
 */
export function clippedBy(el: HTMLElement): HTMLElement | null;
