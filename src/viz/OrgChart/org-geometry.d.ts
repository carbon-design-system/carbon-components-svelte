import type { VizColor } from "../utils/tokens.js";

export type OrgOptions<T> = {
  id: (row: T, index: number) => unknown;
  parent: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  sublabel?: (row: T, index: number) => unknown;
  group?: (row: T, index: number) => unknown;
  collapsed?: ReadonlyArray<string | number>;
  nodeWidth: number;
  nodeHeight: number;
  /** Space between levels. */
  rankGap: number;
  /** Space between cards in a level. */
  nodeGap: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type OrgNode<T> = {
  id: string;
  /** Position in depth first order, which the keyboard follows. */
  index: number;
  row: T;
  label: string;
  sublabel: string;
  group: string | undefined;
  color: string | undefined;
  parentId: string | null;
  depth: number;
  /** Top left corner. */
  x: number;
  y: number;
  /** Whether the node has children, shown or folded away. */
  branch: boolean;
  collapsed: boolean;
  childCount: number;
  /** Nodes folded away under this one. */
  hidden: number;
};

export type Org<T> = {
  /** Depth first, parents before their children. */
  nodes: OrgNode<T>[];
  links: Array<{ id: string; d: string }>;
  width: number;
  height: number;
  groups: Array<{ key: string; color: string }>;
};

/** The tree top down, a card per node, parents centered over children. */
export function buildOrg<T>(
  rows: ReadonlyArray<T>,
  options: OrgOptions<T>,
): Org<T>;
