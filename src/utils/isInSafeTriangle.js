// @ts-check

/**
 * @param {number} px
 * @param {number} py
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @returns {boolean}
 */
function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
  const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
  const c = 1 - a - b;

  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}

/**
 * Check whether `(mouseX, mouseY)` sits in the "safe triangle" between two
 * adjacent rects (e.g. a menu item and the submenu it opens) - the wedge
 * connecting the near edge of `fromRect` to the near corner of `toRect` -
 * so diagonal mouse movement toward the submenu doesn't cause it to close
 * prematurely.
 *
 * @param {number} mouseX
 * @param {number} mouseY
 * @param {{ top: number, left: number, right: number, bottom: number, height: number }} fromRect
 * @param {{ top: number, left: number, right: number, bottom: number, height: number }} toRect
 * @param {number} [buffer] Padding added to the wedge on the `fromRect` side. Default `12`.
 * @returns {boolean}
 */
export function isInSafeTriangle(mouseX, mouseY, fromRect, toRect, buffer = 12) {
  const isToOnRight = toRect.left >= fromRect.right;

  // Submenus commonly render flush against the trigger rect (zero gap), which
  // would otherwise make x1/x2/x3 identical - a zero-area triangle that never
  // contains any point. Give the wedge a minimum depth so it stays usable even
  // with no gap; a wider real gap still wins via the Math.max/min below.
  const MIN_WEDGE_DEPTH = 24;
  let trianglePoints;
  if (isToOnRight) {
    trianglePoints = {
      x1: fromRect.right,
      y1: fromRect.top - buffer,
      x2: fromRect.right,
      y2: fromRect.bottom + buffer,
      x3: Math.max(toRect.left, fromRect.right + MIN_WEDGE_DEPTH),
      y3: toRect.top + toRect.height / 2,
    };
  } else {
    trianglePoints = {
      x1: fromRect.left,
      y1: fromRect.top - buffer,
      x2: fromRect.left,
      y2: fromRect.bottom + buffer,
      x3: Math.min(toRect.right, fromRect.left - MIN_WEDGE_DEPTH),
      y3: toRect.top + toRect.height / 2,
    };
  }

  const inTopTriangle = isPointInTriangle(
    mouseX,
    mouseY,
    trianglePoints.x1,
    trianglePoints.y1,
    isToOnRight ? trianglePoints.x3 : trianglePoints.x2,
    toRect.top,
    trianglePoints.x3,
    trianglePoints.y3,
  );

  const inBottomTriangle = isPointInTriangle(
    mouseX,
    mouseY,
    trianglePoints.x2,
    trianglePoints.y2,
    trianglePoints.x3,
    trianglePoints.y3,
    isToOnRight ? trianglePoints.x3 : trianglePoints.x1,
    toRect.bottom,
  );

  return inTopTriangle || inBottomTriangle;
}
