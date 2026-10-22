import type { ChartGroup, ChartScales } from "./model.js";

/** The size a tooltip will take, from its text. */
export function estimateTooltipSize(
  title: string,
  rows: ReadonlyArray<{ label: string; value: string }>,
): { width: number; height: number };

/** The visible series as pixel segments between consecutive points. */
export function seriesSegments(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  scales: ChartScales,
  options?: { toBaseline?: boolean },
): Array<[number, number, number, number]>;

/** The first plot corner a box of the size fits in without covering a segment. */
export function freeCorner(
  plot: { x0: number; y0: number; x1: number; y1: number },
  size: { width: number; height: number },
  segments: ReadonlyArray<[number, number, number, number]>,
  inset?: number,
): { x: number; y: number; corner: "tl" | "tr" | "bl" | "br" } | null;
