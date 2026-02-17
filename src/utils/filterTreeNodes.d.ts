type NodeLike = {
  id: string | number;
  text?: string;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

type FilterOptions = {
  /**
   * Include all descendants of matching nodes
   * @default false
   */
  includeChildren?: boolean;
  /**
   * Include all ancestors of matching nodes
   * @default true
   */
  includeAncestors?: boolean;
};

/**
 * Filter tree nodes by a predicate function.
 * Returns a new tree containing only matching nodes and their ancestors.
 *
 * @example
 * const tree = [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child" }] }];
 * const filtered = filterTreeNodes(tree, (node) => node.id === 2);
 * // Result: [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child" }] }]
 */
export function filterTreeNodes<T extends NodeLike>(
  tree: T[],
  predicate: (node: T) => boolean,
  options?: FilterOptions,
): T[];

/**
 * Filter tree nodes by node ID
 *
 * @example
 * const tree = [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child" }] }];
 * const filtered = filterTreeById(tree, 2);
 * // Result: [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child" }] }]
 */
export function filterTreeById<T extends NodeLike>(
  tree: T[],
  id: string | number | (string | number)[],
  options?: FilterOptions,
): T[];

/**
 * Filter tree nodes by text/name (case-insensitive substring match)
 *
 * @example
 * const tree = [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child Node" }] }];
 * const filtered = filterTreeByText(tree, "child");
 * // Result: [{ id: 1, text: "Root", nodes: [{ id: 2, text: "Child Node" }] }]
 */
export function filterTreeByText<T extends NodeLike>(
  tree: T[],
  text: string,
  options?: FilterOptions,
): T[];

export default filterTreeNodes;
