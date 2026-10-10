/**
 * SVG path builder for filled areas and bands.
 */
import type { PathOptions, Point } from "./path-line.js";

/**
 * SVG path `d` for the area between `points` and `baseline`. A number is a
 * flat baseline. An array gives the lower edge per point (same indexes as
 * `points`), for stacked layers, streams, and confidence bands. Each gap-free
 * run closes on its own, so gaps stay empty.
 */
export function pathArea(
  points: ReadonlyArray<Point | null | undefined>,
  baseline: number | ReadonlyArray<number | null | undefined>,
  options?: PathOptions,
): string;
