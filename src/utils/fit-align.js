// @ts-check
// Fits a popover, tooltip or menu to the boxes around it: the side and the
// start or end alignment that fit better, a slide back into the window, or
// the box that cuts it off, so it can move to a portal.

import {
  computePosition,
  parsePlacement,
  slideWithin,
} from "./compute-position.js";
import { clippingBoundary } from "./portal-decision.js";

/**
 * The horizontal room a popover has: the nearest ancestor that clips or
 * scrolls on the x axis, such as a table's scroll container, within the
 * viewport.
 *
 * @param {Element} node
 * @returns {{ left: number, right: number }}
 */
export function horizontalBounds(node) {
  const { left, right } = clippingBoundary(node, "x");
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
 * A Popover placement that keeps `el` in view. It takes the other side when
 * `el` runs past it and the anchor has more room on the other side. Along
 * that side, it takes the edge alignment that overflows least. A left or
 * right popover with no room on either side opens below, or above when
 * only that fits. Across the page, the room is `horizontalBounds`; up and
 * down, it is the window.
 * Placements are physical (`bottom-left`, `left-top`). Keeps `align` when
 * `el` has no layout (zero size) or its anchor is out of the window.
 *
 * The popover is where CSS put it, so its gap to the anchor and its slide
 * along the anchor's edge are measured, and `computePosition` tries the
 * other sides and edges with the same gap and the mirrored slide.
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
  const now = parsePlacement(align);
  const vertical = now.side === "top" || now.side === "bottom";
  const gap = {
    top: a.top - r.bottom,
    bottom: r.top - a.bottom,
    left: a.left - r.right,
    right: r.left - a.right,
  }[now.side];
  const slide = vertical
    ? {
        start: r.left - a.left,
        end: r.right - a.right,
        center: r.left + r.width / 2 - (a.left + a.width / 2),
      }[now.align]
    : {
        start: r.top - a.top,
        end: r.bottom - a.bottom,
        center: r.top + r.height / 2 - (a.top + a.height / 2),
      }[now.align];
  return computePosition(a, r, {
    placement: align,
    boundary: { left: x.left, right: x.right, top: 0, bottom: vh },
    flip: { fallbackAxis: true, align: true },
    // The other edge is the popover mirrored around the anchor's center,
    // which points the caret at the same spot.
    offset: ({ align: edge }) => ({
      main: gap,
      cross:
        edge === now.align
          ? slide
          : edge === "center" || now.align === "center"
            ? 0
            : -slide,
    }),
  }).placement;
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
  const width = document.documentElement.clientWidth;
  // No layout viewport (jsdom), so nothing to fit inside.
  if (width === 0) return applied;
  return slideWithin(rect.left - applied, rect.width, margin, width - margin);
}
