// @ts-check
/**
 * The side a menu opens on in place: `direction`, unless the menu doesn't
 * fit on that side of the window and the other side has more room, the
 * rule a portalled menu already follows. Keeps `direction` when the anchor
 * or menu has no layout (zero size).
 * @param {Element} anchor
 * @param {Element} menu
 * @param {"top" | "bottom"} direction
 * @returns {"top" | "bottom"}
 */
export function menuSide(anchor, menu, direction) {
  const a = anchor.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  if (a.height === 0 || m.height === 0) return direction;
  const below = document.documentElement.clientHeight - a.bottom;
  const above = a.top;
  if (direction === "bottom" && m.height > below && above > below) return "top";
  if (direction === "top" && m.height > above && below > above) return "bottom";
  return direction;
}
