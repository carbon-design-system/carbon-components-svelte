// @ts-check
/**
 * How a menu above or below its anchor should align to it so it stays
 * `margin` px inside the window's sides: `align`, unless the menu runs past
 * a side and another alignment (`start`, `center` or `end`) runs past less.
 * Keeps `align` when the menu has no layout (zero size).
 * @param {Element} menu
 * @param {Element} anchor
 * @param {"start" | "center" | "end"} align
 * @param {number} [margin]
 * @returns {"start" | "center" | "end"}
 */
export function fitIntrinsicAlign(menu, anchor, align, margin = 8) {
  const m = menu.getBoundingClientRect();
  if (m.width === 0 || m.height === 0) return align;
  if (
    m.left >= margin &&
    m.right <= document.documentElement.clientWidth - margin
  ) {
    return align;
  }
  const a = anchor.getBoundingClientRect();
  const width = document.documentElement.clientWidth;
  /** @type {Record<"start" | "center" | "end", number>} */
  const lefts = {
    start: a.left,
    center: a.left + a.width / 2 - m.width / 2,
    end: a.right - m.width,
  };
  // The alignment that overflows the margin least; `align` on a tie.
  /** @param {number} left */
  const overflow = (left) =>
    Math.max(0, margin - left) + Math.max(0, left + m.width - (width - margin));
  let best = align;
  for (const option of /** @type {const} */ (["start", "end", "center"])) {
    if (overflow(lefts[option]) < overflow(lefts[best])) best = option;
  }
  return best;
}
