/**
 * Find the datum nearest a pointer or keyboard position.
 */

/**
 * Index of the value in ascending `sorted` nearest `x`, by binary search.
 * `-1` for empty input. On a tie the lower index wins.
 */
export function bisectNearest(sorted: ReadonlyArray<number>, x: number): number;

/**
 * Uniform grid over 2D points for scatter hover: builds in O(n), answers a
 * nearest query by scanning outward ring by ring from the pointer's cell.
 * `nearest` returns an index into `points`, or `-1` when nothing is within
 * `maxDistance`.
 */
export function createGridIndex(
  points: ReadonlyArray<{ x: number; y: number } | null | undefined>,
  cellSize: number,
): { nearest: (x: number, y: number, maxDistance?: number) => number };
