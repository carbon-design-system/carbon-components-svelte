// @ts-check
/**
 * How far to slide `el` sideways so it sits at least `margin` px inside the
 * window, measured as if no slide were applied. A box wider than the window
 * keeps its left edge in view. A box with no layout (zero size), or a window
 * with none, stays put.
 * @param {Element} el
 * @param {number} applied The slide already applied to `el`, in px.
 * @param {number} [margin]
 * @returns {number}
 */
export function windowShift(el, applied, margin = 8) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0) return applied;
  const left = rect.left - applied;
  const right = rect.right - applied;
  const width = document.documentElement.clientWidth;
  // No layout viewport (jsdom), so nothing to fit inside.
  if (width === 0) return applied;
  if (right > width - margin) {
    return Math.max(width - margin - right, margin - left);
  }
  if (left < margin) return margin - left;
  return 0;
}
