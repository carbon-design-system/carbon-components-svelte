import type { VizColor } from "../utils/tokens.js";

export type ArcDiagramOptions<N, L> = {
  id: (row: N, index: number) => unknown;
  label?: (row: N, index: number) => unknown;
  group?: (row: N, index: number) => unknown;
  source: (row: L, index: number) => unknown;
  target: (row: L, index: number) => unknown;
  value?: (row: L, index: number) => unknown;
  sort?: "none" | "group" | "degree";
  /** Whether a backward link arcs under the line. */
  directed?: boolean;
  width: number;
  /** Stroke width of the thinnest and thickest link. */
  strokeRange?: [number, number];
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type ArcNode<N> = {
  key: string;
  label: string;
  group: string | undefined;
  color: string | undefined;
  datum: N;
  index: number;
  /** Position along the line. */
  order: number;
  /** Links touching the node. */
  degree: number;
  x: number;
};

export type ArcLink<L> = {
  id: string;
  source: string;
  target: string;
  value: number;
  backward: boolean;
  stroke: number;
  color: string | undefined;
  datum: L;
  index: number;
  d: string;
};

export type ArcDiagram<N, L> = {
  nodes: ArcNode<N>[];
  links: ArcLink<L>[];
  /** Tallest arc over the line, and under it. */
  above: number;
  below: number;
  groups: Array<{ key: string; color: string }>;
};

/** Nodes on a line and a semicircle per link. */
export function buildArcDiagram<N, L>(
  nodes: ReadonlyArray<N>,
  links: ReadonlyArray<L>,
  options: ArcDiagramOptions<N, L>,
): ArcDiagram<N, L>;
