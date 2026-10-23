import type { VizColor } from "../utils/tokens.js";

export type RadarOptions<T> = {
  axis: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  series: (row: T, index: number) => unknown;
  radius: number;
  cx: number;
  cy: number;
  /** End of the radial scale. Defaults to the largest value, rounded out. */
  max?: number;
  hidden?: ReadonlyArray<string>;
  palette?: number;
  colors?: Record<string, VizColor>;
  /** How far past the end of a spoke its label sits. @default 12 */
  labelOffset?: number;
};

export type RadarAxis = {
  key: string;
  index: number;
  /** End of the spoke. */
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
};

export type RadarSeries = {
  key: string;
  hidden: boolean;
  color: string;
  /** Value per spoke, in spoke order. Zero where the series has no row. */
  values: number[];
  /** SVG `points` of the polygon. */
  points: string;
  vertices: Array<{ x: number; y: number; value: number }>;
};

export type Radar = {
  max: number;
  axes: RadarAxis[];
  rings: Array<{ value: number; points: string; labelY: number }>;
  series: RadarSeries[];
};

/**
 * Lay rows out on spokes: one per distinct `axis` value, in first-seen
 * order, clockwise from 12 o'clock. Every spoke shares one radial scale from
 * zero, so the axes must share a unit. A series with no row on a spoke
 * counts as zero there, since a polygon cannot have a gap. Rows that share a
 * series and a spoke are summed.
 */
export function buildRadar<T>(
  rows: ReadonlyArray<T>,
  options: RadarOptions<T>,
): Radar;

/** Index of the spoke nearest a point, by angle. `-1` with no spokes. */
export function nearestSpoke(
  x: number,
  y: number,
  cx: number,
  cy: number,
  count: number,
): number;
