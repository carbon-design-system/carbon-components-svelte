/**
 * SVG arcs for donut, pie, and gauge marks. Angles are radians, `0` at
 * 12 o'clock, increasing clockwise.
 */

export type ArcOptions = {
  /** @default 0 */
  cx?: number;
  /** @default 0 */
  cy?: number;
  /** `0` for a pie wedge. @default 0 */
  innerRadius?: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  /** Gap between neighbors, split evenly across both ends. @default 0 */
  padAngle?: number;
};

export type PieOptions = {
  /** @default 0 */
  startAngle?: number;
  /** @default 2π */
  endAngle?: number;
  /** Carried onto each slice for `pathArc`. @default 0 */
  padAngle?: number;
  /** Lay slices out largest first. Output stays in input order. @default false */
  sort?: boolean;
};

export type PieSlice = {
  /** Index into the input `values`. */
  index: number;
  value: number;
  startAngle: number;
  endAngle: number;
  padAngle: number;
};

/**
 * SVG path `d` for an annular sector. `innerRadius: 0` gives a pie wedge. A
 * span of a full turn or more draws a complete ring from two half arcs,
 * since one SVG arc cannot return to its own start.
 */
export function pathArc(options: ArcOptions): string;

/** Midpoint of an arc, for placing a label or tooltip anchor. */
export function arcCentroid(options: ArcOptions): { x: number; y: number };

/**
 * Divide an angular span among `values` in proportion. Negative and
 * non-finite values count as zero. When every value is zero, slices are all
 * zero-width rather than `NaN`.
 */
export function pieAngles(
  values: ReadonlyArray<number>,
  options?: PieOptions,
): PieSlice[];
