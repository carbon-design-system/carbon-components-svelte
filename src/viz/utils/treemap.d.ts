export type TreemapRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Tile `values` into the rectangle, each getting an area in proportion to
 * its value and a shape as close to square as the greedy row packing allows.
 * Largest first, from the top left. Output is in input order. Negative and
 * non-finite values get an empty rectangle. The box defaults to the unit
 * square.
 */
export function squarify(
  values: ReadonlyArray<number>,
  box?: TreemapRect,
): TreemapRect[];
