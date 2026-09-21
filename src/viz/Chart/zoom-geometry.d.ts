import type { ChartGroup } from "./model.js";

/**
 * Keep a window inside `full`, at least `minSpan` wide, and in order. Moving
 * one edge past the other pushes that other edge along rather than crossing.
 * `"both"` pans: the width is kept and the window stops at either end.
 */
export function clampWindow(
  start: number,
  end: number,
  full: readonly [number, number],
  minSpan: number,
  moving?: "start" | "end" | "both",
): [number, number];

/**
 * Area path of the total y at each x over the visible series: the shape of
 * the whole dataset, drawn small. Thinned to about one point per pixel.
 */
export function overviewPath<T>(
  groups: ReadonlyArray<ChartGroup<T>>,
  full: readonly [number, number],
  box: { x0: number; x1: number; height: number },
): string;
