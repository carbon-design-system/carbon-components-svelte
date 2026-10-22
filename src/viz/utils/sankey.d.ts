export type SankeyLinkInput = {
  source: string | number;
  target: string | number;
  value: number;
};

export type SankeyOptions = {
  width: number;
  height: number;
  /** @default 8 */
  nodeWidth?: number;
  /** Least vertical gap between nodes of a column. @default 12 */
  nodePadding?: number;
  /** Relaxation sweeps. @default 6 */
  iterations?: number;
};

export type SankeyNode = {
  id: string;
  index: number;
  /** 0 for a source, counted along the longest path to the node. */
  column: number;
  /** The larger of what flows in and what flows out. */
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Links that leave this node. */
  sourceLinks: SankeyLink[];
  /** Links that arrive at this node. */
  targetLinks: SankeyLink[];
};

export type SankeyLink = {
  /** Index into the input. */
  index: number;
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  /** Thickness of the ribbon. */
  width: number;
  /** Top of the ribbon where it leaves its source. */
  sourceY: number;
  /** Top of the ribbon where it reaches its target. */
  targetY: number;
  /** Closed SVG path of the ribbon. */
  path: string;
};

export type SankeyLayout = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  columns: number;
};

/**
 * Lay out a flow network. Nodes go in columns by their longest path from a
 * source, heights follow the larger of what flows in and out, and a few
 * relaxation sweeps pull each node toward the nodes it connects to, which
 * untangles most crossings. A link that would close a cycle is dropped, as
 * are links with a value that is not positive.
 */
export function sankey(
  links: ReadonlyArray<SankeyLinkInput>,
  options: SankeyOptions,
): SankeyLayout;
