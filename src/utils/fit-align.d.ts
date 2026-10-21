/**
 * Picks the start or end alignment of a popover that fits its container better.
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
