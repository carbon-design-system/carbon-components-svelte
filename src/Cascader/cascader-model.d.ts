export type CascaderId = string | number;

export interface CascaderNode {
  id: CascaderId;
  text: string;
  disabled?: boolean;
  /** Children not loaded yet. */
  hasChildren?: boolean;
  nodes?: CascaderNode[];
}

export interface SelectionTreeNode {
  id: string;
  disabled?: boolean;
  nodes?: SelectionTreeNode[];
}

export type LoadedChildren = ReadonlyMap<string, ReadonlyArray<CascaderNode>>;

export interface CascaderSearchResult {
  ids: CascaderId[];
  nodes: CascaderNode[];
  key: string;
  /** The labels joined, the text a query matches. */
  text: string;
  ranges: Array<{ start: number; end: number }>;
}

/** The key that names a path. */
export function pathKey(ids: ReadonlyArray<CascaderId>): string;

/** The key of a child of the node at `key`. */
export function childKey(key: string, id: CascaderId): string;

/** A node's own `nodes`, else what a lazy load returned, else `null`. */
export function childrenOf(
  node: CascaderNode,
  key: string,
  loaded: LoadedChildren,
): ReadonlyArray<CascaderNode> | null;

/** Whether the node opens a column. */
export function isBranch(
  node: CascaderNode,
  key: string,
  loaded: LoadedChildren,
): boolean;

/** Whether opening the node needs `loadChildren`. */
export function needsLoad(
  node: CascaderNode,
  key: string,
  loaded: LoadedChildren,
): boolean;

/** Follow `ids` down from the roots. */
export function resolvePath(
  nodes: ReadonlyArray<CascaderNode>,
  loaded: LoadedChildren,
  ids: ReadonlyArray<CascaderId>,
): { nodes: CascaderNode[]; complete: boolean };

/** Paths whose joined labels contain every term of `query`. */
export function searchPaths(
  nodes: ReadonlyArray<CascaderNode>,
  loaded: LoadedChildren,
  query: string,
  options?: { separator?: string; limit?: number; leafOnly?: boolean },
): { results: CascaderSearchResult[]; truncated: boolean };

/** The tree `createSelection` rolls checks up in. */
export function toSelectionTree(
  nodes: ReadonlyArray<CascaderNode>,
  loaded: LoadedChildren,
  parentKey?: string,
): SelectionTreeNode[];

/** The paths a set of checked keys reports, in document order. */
export function checkedPaths(
  nodes: ReadonlyArray<CascaderNode>,
  loaded: LoadedChildren,
  checked: ReadonlySet<string>,
  mode?: "parent" | "leaf",
): CascaderId[][];

export function joinLabels(
  path: ReadonlyArray<CascaderNode>,
  separator: string,
): string;

export function samePath(
  a: ReadonlyArray<CascaderId>,
  b: ReadonlyArray<CascaderId>,
): boolean;

export function samePaths(
  a: ReadonlyArray<ReadonlyArray<CascaderId>>,
  b: ReadonlyArray<ReadonlyArray<CascaderId>>,
): boolean;

export interface CascaderEntry {
  key: string;
  id: CascaderId;
  node: CascaderNode;
  /** The path from the root to this node. */
  ids: CascaderId[];
  col: number;
  index: number;
  /** Siblings in the column. */
  size: number;
  branch: boolean;
  disabled: boolean;
}

export interface CascaderColumn {
  /** The key of the parent, `""` for the roots. */
  key: string;
  parent: CascaderNode | null;
  entries: CascaderEntry[];
  status: "loading" | "error" | undefined;
}

/** The columns the open path shows. */
export function buildColumns(
  nodes: ReadonlyArray<CascaderNode>,
  loaded: LoadedChildren,
  trail: ReadonlyArray<CascaderId>,
  loadStates: ReadonlyMap<string, "loading" | "error">,
): { columns: CascaderColumn[]; entryByKey: Map<string, CascaderEntry> };
