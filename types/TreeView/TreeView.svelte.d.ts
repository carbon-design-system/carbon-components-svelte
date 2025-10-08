import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type TreeNodeId = string | number;

export interface TreeNode {
  id: TreeNodeId;
  text: any;
  icon?: any;
  disabled?: boolean;
  nodes?: TreeNode[];
}
export type TreeViewContext = {
  activeNodeId: import("svelte/store").Writable<TreeNodeId>;
  selectedNodeIds: import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>;
  expandedNodeIds: import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>;
  clickNode: (node: TreeNode) => void;
  selectNode: (node: TreeNode) => void;
  expandNode: (node: TreeNode, expanded: boolean) => void;
  focusNode: (node: TreeNode) => void;
  toggleNode: (node: TreeNode) => void;
};

type $RestProps = SvelteHTMLElements["ul"];

type $Props = {
  /**
   * Provide an array of nodes to render
   * @default []
   */
  nodes?: Array<TreeNode>;

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

  [key: `data-${string}`]: any;
};

export type TreeViewProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TreeView extends SvelteComponentTyped<
  TreeViewProps,
  {
    select: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    toggle: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    focus: CustomEvent<TreeNode & { expanded: boolean; leaf: boolean }>;
    keydown: WindowEventMap["keydown"];
  },
  {
    default: {
      node: {
        id: TreeNodeId;
        text: string;
        expanded: boolean;
        leaf: boolean;
        disabled: boolean;
        selected: boolean;
      };
    };
    labelText: Record<string, never>;
  }
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

  /**
   * Programmatically select a node by `id` without changing focus or expansion state
   */
  selectNode: (id: TreeNodeId) => void;

  /**
   * Programmatically show a node by `id`.
   * The matching node will be expanded, selected, and focused
   */
  showNode: (id: TreeNodeId) => void;
}
