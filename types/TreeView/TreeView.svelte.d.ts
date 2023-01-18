/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type TreeNodeId = string | number;

export interface TreeNode {
  id: TreeNodeId;
  text: any;
  icon?: typeof import("svelte").SvelteComponent;
  disabled?: boolean;
  children?: TreeNode[];
}

export interface TreeViewProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Provide an array of children nodes to render
   * @default []
   */
  children?: Array<TreeNode>;

  /**
   * Set the current active node id
   * Only one node can be active
   * @default ""
   */
  activeId?: TreeNodeId;

  /**
   * Set the node ids to be selected
   * @default []
   */
  selectedIds?: ReadonlyArray<TreeNodeId>;

  /**
   * Set the node ids to be expanded
   * @default []
   */
  expandedIds?: ReadonlyArray<TreeNodeId>;

  /**
   * Specify the TreeView size
   * @default "default"
   */
  size?: "default" | "compact";

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class TreeView extends SvelteComponentTyped<
  TreeViewProps,
  {
    select: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    toggle: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    focus: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    keydown: WindowEventMap["keydown"];
  },
  { labelText: {} }
> {
  /**
   * Programmatically expand all nodes
   */
  expandAll: () => void;

  /**
   * Programmatically collapse all nodes
   */
  collapseAll: () => void;

  /**
   * Programmatically expand a subset of nodes.
   * Expands all nodes if no argument is provided
   */
  expandNodes: (filterId?: (node: TreeNode) => boolean) => void;

  /**
   * Programmatically collapse a subset of nodes.
   * Collapses all nodes if no argument is provided
   */
  collapseNodes: (filterId?: (node: TreeNode) => boolean) => void;
}
