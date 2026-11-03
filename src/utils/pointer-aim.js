// @ts-check

/**
 * True when the pointer moved from `from` to `point` toward `rect`: `point`
 * falls inside the triangle that `from` forms with the two corners of the
 * rect's near vertical edge. Corners extend `tolerance` px past the edge,
 * and a point on a side counts as inside.
 *
 * A point past the near edge and within the rect's vertical span also
 * counts. The edge facing `from` is the near one, so a submenu on either
 * side (or in either text direction) works. Returns false when `from` sits
 * within the rect's horizontal span (no edge faces it), when the rect has
 * no height, or when `point` did not move.
 *
 * @param {{ x: number, y: number }} point Current pointer position.
 * @param {{ x: number, y: number }} from Earlier pointer position.
 * @param {{ top: number, right: number, bottom: number, left: number }} rect
 * @param {number} [tolerance]
 * @returns {boolean}
 */
export function isAimingAt(point, from, rect, tolerance = 4) {
  if (rect.bottom <= rect.top) return false;
  if (point.x === from.x && point.y === from.y) return false;

  let edge;
  if (from.x <= rect.left) edge = rect.left;
  else if (from.x >= rect.right) edge = rect.right;
  else return false;

  const top = rect.top - tolerance;
  const bottom = rect.bottom + tolerance;

  // Past the edge, the pointer has reached the rect's side. This also
  // covers `from` on the edge itself (a submenu flush against its
  // trigger), where the triangle has no area.
  if (edge === rect.left ? point.x >= edge : point.x <= edge) {
    return point.y >= top && point.y <= bottom;
  }
  if (from.x === edge) return false;

  // Sign of the cross product per side. Same sign or zero on all three
  // means inside or on a side. No division, so no NaN for thin triangles.
  const d1 = cross(point.x, point.y, from.x, from.y, edge, top);
  const d2 = cross(point.x, point.y, edge, top, edge, bottom);
  const d3 = cross(point.x, point.y, edge, bottom, from.x, from.y);

  const negative = d1 < 0 || d2 < 0 || d3 < 0;
  const positive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(negative && positive);
}

/**
 * @param {number} px
 * @param {number} py
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function cross(px, py, x1, y1, x2, y2) {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}
