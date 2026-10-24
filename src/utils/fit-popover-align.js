// @ts-check
/**
 * A Popover `align` that keeps `el` inside the window: the opposite side
 * when it runs past the window on its side and the anchor has more room on
 * the other, and the other edge alignment when it runs past the window's
 * edge along that side. Keeps `align` when `el` has no layout (zero size)
 * or its anchor is out of the window, so there's no view to fit.
 * @param {Element} el The open popover.
 * @param {Element} anchor What the popover is placed against.
 * @param {string} align
 * @param {number} [margin]
 * @returns {string}
 */
export function fitPopoverAlign(el, anchor, align, margin = 8) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return align;
  const a = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw) return align;
  let [side, edge = ""] = align.split("-");

  if (side === "bottom" && r.bottom > vh && a.top > vh - a.bottom) side = "top";
  else if (side === "top" && r.top < 0 && vh - a.bottom > a.top)
    side = "bottom";
  else if (side === "right" && r.right > vw && a.left > vw - a.right) {
    side = "left";
  } else if (side === "left" && r.left < 0 && vw - a.right > a.left) {
    side = "right";
  }

  if (side === "top" || side === "bottom") {
    if (r.right > vw - margin && a.right - r.width >= margin) edge = "right";
    else if (r.left < margin && a.left + r.width <= vw - margin) edge = "left";
  } else {
    if (r.bottom > vh - margin && a.bottom - r.height >= margin)
      edge = "bottom";
    else if (r.top < margin && a.top + r.height <= vh - margin) edge = "top";
  }
  return edge ? `${side}-${edge}` : side;
}
