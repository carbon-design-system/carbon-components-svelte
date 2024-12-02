import { type TreeNode } from "./TreeView.svelte";
/**
 * Create a nested array from a flat array
 */
export function toHierarchy(
  flatArray: TreeNode[] & { pid?: any }[],
): TreeNode[];

export default toHierarchy;
