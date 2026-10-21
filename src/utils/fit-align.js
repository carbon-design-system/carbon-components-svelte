// @ts-check
// Picks the start or end alignment of a popover that fits its container better.

/**
 * The horizontal room a popover has: the nearest ancestor that clips or
 * scrolls on the x axis, such as a table's scroll container, within the
 * viewport.
 *
 * @param {Element} node
 * @returns {{ left: number, right: number }}
 */
export function horizontalBounds(node) {
  let left = 0;
  let right = document.documentElement.clientWidth;
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (getComputedStyle(el).overflowX !== "visible") {
      const rect = el.getBoundingClientRect();
      left = Math.max(left, rect.left + el.clientLeft);
      right = Math.min(right, rect.left + el.clientLeft + el.clientWidth);
      break;
    }
  }
  return { left, right };
}

/**
 * Whether a start- or end-aligned popover overflows `bounds` less on the
 * other side. Both alignments point the caret at the trigger's center, so
 * the other side is the popover mirrored around that center.
 *
 * @param {{ left: number, right: number }} popover
 * @param {number} center Horizontal center of the trigger
 * @param {{ left: number, right: number }} bounds
 * @returns {boolean}
 */
export function shouldFlipAlign(popover, center, bounds) {
  /** @param {number} left @param {number} right */
  const overflow = (left, right) =>
    Math.max(0, bounds.left - left) + Math.max(0, right - bounds.right);
  const current = overflow(popover.left, popover.right);
  if (current === 0) return false;
  return (
    overflow(2 * center - popover.right, 2 * center - popover.left) < current
  );
}
