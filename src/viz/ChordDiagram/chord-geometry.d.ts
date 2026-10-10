import type { VizColor } from "../utils/tokens.js";

export type ChordOptions<T> = {
  source: (row: T, index: number) => unknown;
  target: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  /** The node order around the circle. Defaults to first seen. */
  nodes?: ReadonlyArray<string | number>;
  radius: number;
  /** Depth of the group arcs. */
  thickness: number;
  /** Gap between groups, in radians. */
  padAngle?: number;
  sort?: "none" | "value";
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type ChordGroup = {
  key: string;
  /** Position in the given or first-seen order. */
  index: number;
  /** What the group sends, which sizes its arc. */
  total: number;
  out: number;
  /** What the group receives, shown by the ribbons arriving. */
  in: number;
  startAngle: number;
  endAngle: number;
  color: string;
  d: string;
  labelAngle: number;
  labelX: number;
  labelY: number;
  /** Whether the label sits on the left half and is turned around. */
  flip: boolean;
};

export type ChordRibbon<T> = {
  id: string;
  /** The end sending more. */
  source: string;
  target: string;
  /** Flow from source to target. */
  forward: number;
  /** Flow from target to source. */
  backward: number;
  value: number;
  color: string;
  rows: T[];
  d: string;
};

export type Chord<T> = {
  /** In drawing order around the circle. */
  groups: ChordGroup[];
  ribbons: ChordRibbon<T>[];
  /** Everything that flows. */
  total: number;
  keys: string[];
};

/** Groups around a circle and a ribbon per pair, from tidy flows. */
export function buildChord<T>(
  rows: ReadonlyArray<T>,
  options: ChordOptions<T>,
): Chord<T>;
