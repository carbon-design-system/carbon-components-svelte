/**
 * Layered layout for a directed graph.
 */
export type LayeredOptions = {
  /** Ranks run down, or left to right. @default "TB" */
  rankDir?: "TB" | "LR";
  /** @default 120 */
  nodeWidth?: number;
  /** @default 36 */
  nodeHeight?: number;
  /** Space between ranks. @default 40 */
  rankGap?: number;
  /** Space between nodes in a rank. @default 24 */
  nodeGap?: number;
  /** Ids whose descendants are left out. */
  collapsed?: ReadonlyArray<string | number>;
  /** Lane order. Defaults to first-seen order of the nodes' lanes. */
  lanes?: ReadonlyArray<string | number>;
  /** Ordering sweeps. @default 8 */
  sweeps?: number;
};

export type LayeredNode<T> = {
  id: string;
  label: string;
  lane: string | undefined;
  datum: T;
  index: number;
  rank: number;
  /** Position within the rank. */
  order: number;
  /** Top left corner. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Outgoing and incoming edges, shown or not. */
  children: number;
  parents: number;
  collapsed: boolean;
  /** Nodes folded away under this one. */
  hidden: number;
};

export type LayeredEdge = {
  /** `source->target`. */
  id: string;
  source: string;
  target: string;
  /** Points back up the ranks: it would have closed a cycle. */
  reversed: boolean;
  /** From the source's edge to the target's, through any rank between. */
  points: Array<{ x: number; y: number }>;
};

export type LayeredLayout<T> = {
  /** Reading order: by rank, then by position. */
  nodes: LayeredNode<T>[];
  edges: LayeredEdge[];
  lanes: Array<{ key: string; x0: number; y0: number; x1: number; y1: number }>;
  width: number;
  height: number;
  ranks: number;
};

/**
 * Lay a directed graph out in ranks, with cycles cut, collapsed subgraphs
 * left out, and optional lanes.
 */
export function layoutLayered<T = unknown>(
  nodes: ReadonlyArray<{
    id: string | number;
    label?: string;
    lane?: string | number;
    datum?: T;
  }>,
  edges: ReadonlyArray<{ source: string | number; target: string | number }>,
  options?: LayeredOptions,
): LayeredLayout<T>;
