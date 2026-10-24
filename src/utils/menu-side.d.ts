/**
 * The side a menu opens on in place: `direction`, unless the menu doesn't
 * fit on that side of the window and the other side has more room. Keeps
 * `direction` when the anchor or menu has no layout (zero size), or the
 * anchor is out of the window.
 */
export function menuSide(
  anchor: Element,
  menu: Element,
  direction: "top" | "bottom",
): "top" | "bottom";
