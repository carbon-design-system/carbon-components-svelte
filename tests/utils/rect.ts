type RectEdges = {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
};

/**
 * Builds a real `DOMRect` for a `getBoundingClientRect` stub from whichever
 * edges and sizes the test cares about. Missing values default to zero or are
 * derived from the others, so `rect({ top: 0, bottom: 100 })` has a height of
 * 100. Throws when an edge and a size disagree.
 */
export function rect({
  top = 0,
  left = 0,
  right,
  bottom,
  width,
  height,
}: RectEdges = {}): DOMRect {
  const w = width ?? (right === undefined ? 0 : right - left);
  const h = height ?? (bottom === undefined ? 0 : bottom - top);
  if (right !== undefined && right !== left + w)
    throw new Error(`rect: right ${right} != left ${left} + width ${w}`);
  if (bottom !== undefined && bottom !== top + h)
    throw new Error(`rect: bottom ${bottom} != top ${top} + height ${h}`);
  return new DOMRect(left, top, w, h);
}
