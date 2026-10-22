// @ts-check
// Find the datum nearest a pointer or keyboard position.

/**
 * Index of the value in ascending `sorted` nearest `x`, by binary search.
 * `-1` for empty input. On a tie the lower index wins.
 *
 * @param {ReadonlyArray<number>} sorted
 * @param {number} x
 * @returns {number}
 */
export function bisectNearest(sorted, x) {
  const n = sorted.length;
  if (n === 0) return -1;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && x - sorted[lo - 1] <= sorted[lo] - x) return lo - 1;
  return lo;
}

/**
 * Uniform grid over 2D points for scatter hover: builds in O(n), answers a
 * nearest query by scanning outward ring by ring from the pointer's cell.
 *
 * @param {ReadonlyArray<{ x: number, y: number } | null | undefined>} points
 * @param {number} cellSize Pixels. Near the typical hover radius works well.
 * @returns {{ nearest: (x: number, y: number, maxDistance?: number) => number }}
 */
export function createGridIndex(points, cellSize) {
  const size = cellSize > 0 ? cellSize : 1;
  /** @type {Map<string, number[]>} */
  const cells = new Map();
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    const col = Math.floor(point.x / size);
    const row = Math.floor(point.y / size);
    const key = `${col},${row}`;
    const cell = cells.get(key);
    if (cell) cell.push(i);
    else cells.set(key, [i]);
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  }

  let total = 0;
  for (const cell of cells.values()) total += cell.length;

  return {
    nearest(x, y, maxDistance = Number.POSITIVE_INFINITY) {
      if (cells.size === 0) return -1;
      const col = Math.floor(x / size);
      const row = Math.floor(y / size);
      const reach = Math.max(
        Math.abs(col - minCol),
        Math.abs(col - maxCol),
        Math.abs(row - minRow),
        Math.abs(row - maxRow),
      );
      const limit = Number.isFinite(maxDistance)
        ? Math.min(reach, Math.ceil(maxDistance / size))
        : reach;

      let best = -1;
      let bestDistance = maxDistance * maxDistance;

      /** @param {number[] | undefined} cell */
      function visit(cell) {
        if (!cell) return;
        for (let k = 0; k < cell.length; k++) {
          const point = /** @type {{ x: number, y: number }} */ (
            points[cell[k]]
          );
          const dx = point.x - x;
          const dy = point.y - y;
          const distance = dx * dx + dy * dy;
          if (
            distance < bestDistance ||
            (distance === bestDistance && best === -1)
          ) {
            best = cell[k];
            bestDistance = distance;
          }
        }
      }

      // Rings cost their perimeter in lookups. From far outside the data, or
      // across very sparse data, that dwarfs a plain scan of what is there.
      if (limit * limit > total) {
        for (const cell of cells.values()) visit(cell);
        return best;
      }

      for (let ring = 0; ring <= limit; ring++) {
        // A point in this ring is at least (ring - 1) cells away.
        const floor = (ring - 1) * size;
        if (best !== -1 && floor > 0 && floor * floor > bestDistance) break;
        if (ring === 0) {
          visit(cells.get(`${col},${row}`));
          continue;
        }
        // Walk the perimeter only: top and bottom edges, then the sides.
        for (let c = col - ring; c <= col + ring; c++) {
          visit(cells.get(`${c},${row - ring}`));
          visit(cells.get(`${c},${row + ring}`));
        }
        for (let r = row - ring + 1; r <= row + ring - 1; r++) {
          visit(cells.get(`${col - ring},${r}`));
          visit(cells.get(`${col + ring},${r}`));
        }
      }
      return best;
    },
  };
}
