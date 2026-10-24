/**
 * How a menu above or below its anchor should align to it so it stays
 * `margin` px (8 by default) inside the window's sides: `align`, unless the
 * menu runs past a side and another alignment runs past less. Keeps `align`
 * when the menu has no layout (zero size).
 */
export function fitIntrinsicAlign(
  menu: Element,
  anchor: Element,
  align: "start" | "center" | "end",
  margin?: number,
): "start" | "center" | "end";
