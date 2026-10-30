/**
 * Fits a popover, tooltip or menu to the boxes around it: the side and the
 * start or end alignment that fit better, a slide back into the window, or
 * the box that cuts it off, so it can move to a portal.
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
 * A Popover placement that keeps `el` in view: the other side when `el`
 * runs past it and the anchor has more room there, and the edge alignment
 * along that side that overflows least. A left or right popover with no
 * room on either side opens below, or above when only that fits. Across
 * the page, the room is `horizontalBounds`; up and down, the window.
 * Placements are physical (`bottom-left`, `left-top`). Keeps `align` when
 * `el` has no layout (zero size) or its anchor is out of the window.
 */
export function fitPopoverAlign(
  el: Element,
  anchor: Element,
  align: string,
): string;

/**
 * The Popover placement of a box that `FloatingPortal` placed on `side`,
 * at the start, center or end along it. Start is the left or the top, and
 * end is the right or the bottom: `bottom` and `start` give `bottom-left`,
 * `right` and `end` give `right-bottom`. The edge always lies along the
 * side, so the placement is always a real one.
 */
export function sidePlacement(
  side: "top" | "bottom" | "left" | "right",
  align: "start" | "center" | "end",
): string;

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
 * Keeps a portalled tooltip's body inside the window while the tooltip
 * sits above or below its anchor: slides it sideways by `windowShift` each
 * time the portal places it or the body resizes. The caret, a sibling,
 * stays on the anchor.
 */
export function slideIntoWindow(node: HTMLElement): { destroy(): void };

/**
 * The first box that cuts `el` off: an ancestor whose overflow isn't
 * `visible` on an axis where `el` reaches past its edge, counting only
 * boxes that position `el`. `null` when nothing clips it or `el` has no
 * layout (zero size).
 */
export function clippedBy(el: HTMLElement): HTMLElement | null;
