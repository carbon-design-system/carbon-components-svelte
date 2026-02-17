type NodeLike = {
  id: string | number;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

/** Create a hierarchical tree from a flat array. */
export function toHierarchy<
  T extends NodeLike,
  K extends keyof Omit<T, "id" | "nodes">,
>(
  flatArray: T[] | readonly T[],
  /**
   * Function that returns the parent ID for a given node.
   * @example
   * toHierarchy(flatArray, (node) => node.parentId);
   */
  getParentId: (node: T) => T[K] | null,
): (T & { nodes?: (T & { nodes?: T[] })[] })[];

export default toHierarchy;
