// @ts-check
// Fits a popover, tooltip or menu to the boxes around it: the start or end
// alignment that fits its container better, a slide back into the window,
// or the box that cuts it off, so it can move to a portal.

/**
 * The edges of the area `box` clips its content to: its padding box, inside
 * the borders and scrollbars.
 * @param {Element} box
 */
function clipRect(box) {
  const outer = box.getBoundingClientRect();
  const left = outer.left + box.clientLeft;
  const top = outer.top + box.clientTop;
  return {
    left,
    top,
    right: left + box.clientWidth,
    bottom: top + box.clientHeight,
  };
}

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
      const clip = clipRect(el);
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
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

/**
 * The first box that cuts `el` off: an ancestor whose overflow isn't
 * `visible` on an axis where `el` reaches past its edge. Only boxes that
 * position `el` count: an absolutely positioned `el` escapes the boxes
 * inside its positioning parent, and a fixed one escapes them all. `null`
 * when nothing clips it, or when `el` has no layout (zero size).
 * @param {HTMLElement} el
 * @returns {HTMLElement | null}
 */
export function clippedBy(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const position = getComputedStyle(el).position;
  if (position === "fixed") return null;
  const anchor = position === "absolute" ? el.offsetParent : null;
  for (
    let box = el.parentElement;
    box && box !== document.body && box !== document.documentElement;
    box = box.parentElement
  ) {
    if (anchor && !box.contains(anchor)) continue;
    const style = getComputedStyle(box);
    const clipsX = style.overflowX !== "visible";
    const clipsY = style.overflowY !== "visible";
    if (!clipsX && !clipsY) continue;
    const clip = clipRect(box);
    // 1px of slack absorbs subpixel rounding at the edges.
    if (clipsX && (rect.left < clip.left - 1 || rect.right > clip.right + 1)) {
      return box;
    }
    if (clipsY && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1)) {
      return box;
    }
  }
  return null;
}
