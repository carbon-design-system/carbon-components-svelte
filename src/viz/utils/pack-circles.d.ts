export type PackedCircle = { x: number; y: number; r: number };

export type Packing = {
  /** In input order, around the origin. */
  circles: PackedCircle[];
  /** Radius of a circle around the origin that holds them all. */
  radius: number;
};

/**
 * Pack circles around the origin. Largest first: each circle goes to the
 * spot nearest the center where it touches two circles already placed and
 * overlaps none. Output is in input order, with a circle that holds them
 * all, centered on the origin. A radius that is not positive gets a circle
 * of radius 0 at the origin. `padding` is the least gap between circles.
 */
export function packCircles(
  radii: ReadonlyArray<number>,
  options?: { padding?: number },
): Packing;
