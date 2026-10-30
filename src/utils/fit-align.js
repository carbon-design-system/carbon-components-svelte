// @ts-check
// Fits a popover, tooltip or menu to the boxes around it: the side and the
// start or end alignment that fit better, a slide back into the window, or
// the box that cuts it off, so it can move to a portal.

import { observeResize } from "./shared-observer.js";

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
 * The edge alignment along one axis that overflows `bounds` least: `edge`
 * itself, the other edge (mirrored around the anchor's center, as in
 * `shouldFlipAlign`), or, from center, the edge on the side with room.
 * @param {{ left: number, right: number }} box The popover, on this axis.
 * @param {{ left: number, right: number }} anchor
 * @param {{ left: number, right: number }} bounds
 * @param {string} edge `""` for center.
 * @param {[string, string]} names The start and end edge names.
 * @returns {string}
 */
function fitEdge(box, anchor, bounds, edge, [start, end]) {
  /** @param {number} left @param {number} right */
  const overflow = (left, right) =>
    Math.max(0, bounds.left - left) + Math.max(0, right - bounds.right);
  const current = overflow(box.left, box.right);
  if (current === 0) return edge;
  if (edge) {
    const center = (anchor.left + anchor.right) / 2;
    if (!shouldFlipAlign(box, center, bounds)) return edge;
    return edge === start ? end : start;
  }
  const size = box.right - box.left;
  const atStart = overflow(anchor.left, anchor.left + size);
  const atEnd = overflow(anchor.right - size, anchor.right);
  if (Math.min(atStart, atEnd) >= current) return edge;
  return atStart <= atEnd ? start : end;
}

/**
 * A Popover placement that keeps `el` in view. It takes the other side when
 * `el` runs past it and the anchor has more room on the other side. Along
 * that side, it takes the edge alignment that overflows least. Across the
 * page, the room is `horizontalBounds`; up and down, it is the window.
 * Placements are physical (`bottom-left`, `left-top`). Keeps `align` when
 * `el` has no layout (zero size) or its anchor is out of the window.
 * @param {Element} el The open popover.
 * @param {Element} anchor What the popover is placed against.
 * @param {string} align
 * @returns {string}
 */
export function fitPopoverAlign(el, anchor, align) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return align;
  const a = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw) return align;
  const x = horizontalBounds(el);
  let [side, edge = ""] = align.split("-");

  if (side === "top" || side === "bottom") {
    const above = a.top;
    const below = vh - a.bottom;
    if (side === "bottom" && r.bottom > vh && above > below) side = "top";
    else if (side === "top" && r.top < 0 && below > above) side = "bottom";
    edge = fitEdge(r, a, x, edge, ["left", "right"]);
  } else {
    const before = a.left - x.left;
    const after = x.right - a.right;
    if (side === "right" && r.right > x.right && before > after) side = "left";
    else if (side === "left" && r.left < x.left && after > before) {
      side = "right";
    }
    edge = fitEdge(
      { left: r.top, right: r.bottom },
      { left: a.top, right: a.bottom },
      { left: 0, right: vh },
      edge,
      ["top", "bottom"],
    );
  }
  return edge ? `${side}-${edge}` : side;
}

/**
 * The Popover placement of a box that `FloatingPortal` placed on `side`,
 * at the start, center or end along it. Start is the left or the top, and
 * end is the right or the bottom: `bottom` and `start` give `bottom-left`,
 * `right` and `end` give `right-bottom`. The edge always lies along the
 * side, so the placement is always a real one.
 * @param {"top" | "bottom" | "left" | "right"} side
 * @param {"start" | "center" | "end"} align
 * @returns {string}
 */
export function sidePlacement(side, align) {
  if (align === "center") return side;
  const across = side === "top" || side === "bottom";
  if (align === "start") return `${side}-${across ? "left" : "top"}`;
  return `${side}-${across ? "right" : "bottom"}`;
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
 * Keeps a portalled tooltip's body inside the window while the tooltip
 * sits above or below its anchor. The body slides sideways by `windowShift`
 * each time the portal places it and each time the body resizes. The caret
 * is a sibling of the body, so it stays on the anchor.
 * @param {HTMLElement} node The body, inside a `FloatingPortal`.
 */
export function slideIntoWindow(node) {
  const portal = node.closest("[data-floating-portal]");
  function slide() {
    const side = portal?.getAttribute("data-floating-direction");
    const applied = Number.parseFloat(node.style.left) || 0;
    const next =
      side === "top" || side === "bottom" ? windowShift(node, applied) : 0;
    // A slide moves the body, not the portal, so this settles. Skip
    // sub-pixel changes.
    if (Math.abs(next - applied) < 0.5) return;
    node.style.position = next ? "relative" : "";
    node.style.left = next ? `${next}px` : "";
  }
  const observer = new MutationObserver(slide);
  if (portal) {
    observer.observe(portal, {
      attributes: true,
      attributeFilter: ["style", "data-floating-direction"],
    });
  }
  const unobserve = observeResize(node, slide);
  return {
    destroy() {
      observer.disconnect();
      unobserve();
    },
  };
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
