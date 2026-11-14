/**
 * Pin positions for AnnotatedImage: percentages of the image's natural size,
 * 0 at the top and left edges and 100 at the bottom and right edges.
 */

/**
 * Keep a percentage inside the image, to one decimal place. A value that is
 * not a number, or is infinite, becomes 0.
 */
export function clampPercent(value: number): number;

/**
 * The pin position under a pointer: its offset from the image's top left
 * corner, as percentages of the image's drawn size. The corner is physical,
 * so it does not flip in RTL: the image is not text. A pointer outside the
 * image gives the nearest edge. An image with no size (not laid out) gives
 * the center.
 */
export function pointToPercent(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): { x: number; y: number };

/**
 * Move a pin from the arrow keys: `step` percent per press, or `bigStep`
 * with Shift. Arrows are physical (Left moves toward the left edge in any
 * direction) because the pin is in image coordinates. `null` for any other
 * key.
 */
export function nudgePosition(
  position: { x: number; y: number },
  key: string,
  big?: boolean,
  step?: number,
  bigStep?: number,
): { x: number; y: number } | null;
