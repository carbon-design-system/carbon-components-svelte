/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type TreeNodeId = string | number;

export interface TreeNode {
  id: TreeNodeId;
  text: string;
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;
  disabled?: boolean;
  expanded?: boolean;
}

export interface TreeViewProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Provide an array of children nodes to render
   * @default []
   */
  children?: Array<TreeNode & { children?: TreeNode[] }>;

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
  selectedIds?: TreeNodeId[];

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
> {}
