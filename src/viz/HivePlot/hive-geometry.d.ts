import type { VizColor } from "../utils/tokens.js";

export type HiveOptions<N, L> = {
  id: (row: N, index: number) => unknown;
  label?: (row: N, index: number) => unknown;
  /** The kind of node, one axis each. */
  axis: (row: N, index: number) => unknown;
  /** Where along the axis, larger farther out. Defaults to degree. */
  position?: (row: N, index: number) => unknown;
  source: (row: L, index: number) => unknown;
  target: (row: L, index: number) => unknown;
  value?: (row: L, index: number) => unknown;
  /** The axis order, clockwise from the top. Defaults to first seen. */
  axes?: ReadonlyArray<string | number>;
  radius: number;
  innerRadius: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type HiveAxis = {
  key: string;
  angle: number;
  color: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  count: number;
};

export type HiveNode<N> = {
  key: string;
  label: string;
  axis: string;
  color: string;
  degree: number;
  /** What placed the node: its given position or its degree. */
  position: number;
  /** Order along the axis from the center out. */
  rank: number;
  r: number;
  x: number;
  y: number;
  datum: N;
  index: number;
};

export type HiveLink<L> = {
  id: string;
  source: string;
  target: string;
  value: number;
  color: string;
  datum: L;
  index: number;
  d: string;
};

export type Hive<N, L> = {
  axes: HiveAxis[];
  /** Axis by axis, center outward. */
  nodes: HiveNode<N>[];
  links: HiveLink<L>[];
};

/** An axis per kind of node, nodes along it, and a curve per link. */
export function buildHive<N, L>(
  nodes: ReadonlyArray<N>,
  links: ReadonlyArray<L>,
  options: HiveOptions<N, L>,
): Hive<N, L>;
