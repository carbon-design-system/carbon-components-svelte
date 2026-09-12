type NodeLike = {
  id: string | number;
  text?: string;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

type FilterOptions = {
  /** @default false */
  includeChildren?: boolean;
  /** @default true */
  includeAncestors?: boolean;
};

/** Filter tree nodes by a predicate; returns matching nodes and their ancestors. */
export function filterTreeNodes<T extends NodeLike>(
  tree: T[],
  predicate: (node: T) => boolean,
  options?: FilterOptions,
): T[];

/** Filter tree nodes by node ID. */
export function filterTreeById<T extends NodeLike>(
  tree: T[],
  id: string | number | (string | number)[],
  options?: FilterOptions,
): T[];

/** Filter tree nodes by case-insensitive substring match on `text`. */
export function filterTreeByText<T extends NodeLike>(
  tree: T[],
  text: string,
  options?: FilterOptions,
): T[];

export default filterTreeNodes;
