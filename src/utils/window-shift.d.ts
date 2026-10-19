/**
 * How far to slide `el` sideways so it sits at least `margin` px (8 by
 * default) inside the window, measured as if `applied` px weren't applied.
 * A box with no layout (zero size), or a window with none, keeps `applied`.
 */
export function windowShift(
  el: Element,
  applied: number,
  margin?: number,
): number;
