/**
 * A Popover `align` that keeps `el` inside the window: the opposite side
 * when it runs past the window on its side and the anchor has more room on
 * the other, and the other edge alignment along that side. Keeps `align`
 * when `el` has no layout (zero size) or its anchor is out of the window.
 */
export function fitPopoverAlign(
  el: Element,
  anchor: Element,
  align: string,
  margin?: number,
): string;
