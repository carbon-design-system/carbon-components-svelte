/**
 * How far the origin of `position: fixed` boxes in `el` sits from the
 * window's. A transform, filter or containment on `el` or an ancestor makes it
 * the origin, so a box given window coordinates lands that far off. Zero when
 * nothing does.
 */
export function fixedBlockOffset(el: Element): { x: number; y: number };
