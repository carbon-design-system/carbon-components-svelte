// @ts-check
// Pin positions for AnnotatedImage: percentages of the image's natural size,
// 0 at the top and left edges and 100 at the bottom and right edges.

/**
 * Keep a percentage inside the image, to one decimal place. A value that is
 * not a number, or is infinite, becomes 0.
 * @param {number} value
 * @returns {number}
 */
export function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

/**
 * The pin position under a pointer: its offset from the image's top left
 * corner, as percentages of the image's drawn size. The corner is physical,
 * so it does not flip in RTL: the image is not text. A pointer outside the
 * image gives the nearest edge. An image with no size (not laid out) gives
 * the center.
 * @param {{ left: number, top: number, width: number, height: number }} rect
 *   The image's box, as `getBoundingClientRect` returns it.
 * @param {number} clientX
 * @param {number} clientY
 * @returns {{ x: number, y: number }}
 */
export function pointToPercent(rect, clientX, clientY) {
  if (!(rect.width > 0 && rect.height > 0)) return { x: 50, y: 50 };
  return {
    x: clampPercent(((clientX - rect.left) / rect.width) * 100),
    y: clampPercent(((clientY - rect.top) / rect.height) * 100),
  };
}

/**
 * Move a pin from the arrow keys: `step` percent per press, or `bigStep`
 * with Shift. Arrows are physical (Left moves toward the left edge in any
 * direction) because the pin is in image coordinates. `null` for any other
 * key.
 * @param {{ x: number, y: number }} position
 * @param {string} key
 * @param {boolean} [big]
 * @param {number} [step]
 * @param {number} [bigStep]
 * @returns {{ x: number, y: number } | null}
 */
export function nudgePosition(
  position,
  key,
  big = false,
  step = 1,
  bigStep = 10,
) {
  const amount = big ? bigStep : step;
  const dx = key === "ArrowLeft" ? -amount : key === "ArrowRight" ? amount : 0;
  const dy = key === "ArrowUp" ? -amount : key === "ArrowDown" ? amount : 0;
  if (dx === 0 && dy === 0) return null;
  return {
    x: clampPercent(position.x + dx),
    y: clampPercent(position.y + dy),
  };
}
