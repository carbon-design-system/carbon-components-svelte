import type { SankeyOptions } from "../utils/sankey.js";
import type { VizColor } from "../utils/tokens.js";

export type AlluvialOptions<T> = SankeyOptions & {
  source: (row: T, index: number) => unknown;
  target: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  palette?: number;
  /** Fixed color per node. */
  colors?: Record<string, VizColor>;
};

export type AlluvialNode = {
  id: string;
  column: number;
  /** Whether the node sits in the last column, where labels flip sides. */
  last: boolean;
  value: number;
  incoming: number;
  outgoing: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type AlluvialLink<T> = {
  /** Unique to the pair of nodes. */
  id: string;
  source: string;
  target: string;
  value: number;
  path: string;
  color: string;
  /** The rows summed into this link. */
  rows: T[];
};

export type Alluvial<T> = {
  columns: number;
  nodes: AlluvialNode[];
  links: AlluvialLink<T>[];
};

/**
 * Sum rows that share a source and a target, lay the network out, and color
 * each node. A ribbon takes the color of the node it leaves.
 */
export function buildAlluvial<T>(
  rows: ReadonlyArray<T>,
  options: AlluvialOptions<T>,
): Alluvial<T>;
