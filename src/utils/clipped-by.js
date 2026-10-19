// @ts-check
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
    const outer = box.getBoundingClientRect();
    const left = outer.left + box.clientLeft;
    const top = outer.top + box.clientTop;
    if (
      clipsX &&
      (rect.left < left - 1 || rect.right > left + box.clientWidth + 1)
    ) {
      return box;
    }
    if (
      clipsY &&
      (rect.top < top - 1 || rect.bottom > top + box.clientHeight + 1)
    ) {
      return box;
    }
  }
  return null;
}
