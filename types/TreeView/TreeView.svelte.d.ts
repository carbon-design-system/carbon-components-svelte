import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type TreeNodeId = string | number;

export type TreeNode = {
  id: TreeNodeId;
  text: any;
  icon?: any;
  /** Whether the node is disabled */ disabled?: boolean;
  nodes?: TreeNode[];
};

export type ShowNodeOptions = {
  /** Whether to expand the node and its ancestors (default: true) */ expand?: boolean;
  /** Whether to select the node (default: true) */ select?: boolean;
  /** Whether to focus the node (default: true) */ focus?: boolean;
};

export type TreeViewContext<Node extends TreeNode = TreeNode> = {
  activeNodeId: import("svelte/store").Writable<TreeNodeId>;
  selectedNodeIds: import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>;
  expandedNodeIds: import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>;
  clickNode: (node: Node) => void;
  selectNode: (node: Node) => void;
  expandNode: (node: Node, expanded: boolean) => void;
  focusNode: (node: Node) => void;
  toggleNode: (node: Node) => void;
};

type $RestProps = SvelteHTMLElements["ul"];

type $Props<Node extends TreeNode = TreeNode> = {
  /**
   * Provide an array of nodes to render.
   * @default []
   */
  nodes?: ReadonlyArray<Node>;

  /**
   * Set the current active node id.
   * Only one node can be active.
   * @default ""
   */
  activeId?: TreeNodeId;

  /**
   * Set the node ids to be selected.
   * @default []
   */
  selectedIds?: ReadonlyArray<TreeNodeId>;

  /**
   * Set the node ids to be expanded.
   * @default []
   */
  expandedIds?: ReadonlyArray<TreeNodeId>;

  /**
   * Specify the TreeView size.
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

  /**
   * Set to `true` to automatically collapse sibling nodes when expanding a node.
   * When enabled, only one node at each level can be expanded at a time.
   * @default false
   */
  autoCollapse?: boolean;

  labelChildren?: (this: void) => void;

  children?: (
    this: void,
    ...args: [
      {
        node: {
          id: TreeNodeId;
          text: string;
          expanded: boolean;
          leaf: boolean;
          disabled: boolean;
          selected: boolean;
        };
      },
    ]
  ) => void;

  [key: `data-${string}`]: any;
};

export type TreeViewProps<Node extends TreeNode = TreeNode> = Omit<
  $RestProps,
  keyof $Props<Node>
> &
  $Props<Node>;

export default class TreeView<
  Node extends TreeNode = TreeNode,
> extends SvelteComponentTyped<
  TreeViewProps<Node>,
  {
    select: CustomEvent<
      Node & { expanded: boolean; leaf: boolean; selected: boolean }
    >;
    toggle: CustomEvent<
      Node & { expanded: boolean; leaf: boolean; selected: boolean }
    >;
    focus: CustomEvent<
      Node & { expanded: boolean; leaf: boolean; selected: boolean }
    >;
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
    labelChildren: Record<string, never>;
  }
> {
  /**
   * Programmatically expand all nodes
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandAll()}>Expand All</button>
   * ```
   */
  expandAll: () => void;

  /**
   * Programmatically collapse all nodes
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.collapseAll()}>Collapse All</button>
   * ```
   */
  collapseAll: () => void;

  /**
   * Programmatically expand a subset of nodes.
   * Expands all nodes if no argument is provided.
   * Filter function should return `true` for nodes to expand. If not provided, expands all nodes.
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandNodes((node) => node.id.startsWith('folder-'))}>
   *   Expand Folders
   * </button>
   * ```
   */
  expandNodes: (filterNode?: (node: Node) => boolean) => void;

  /**
   * Programmatically collapse a subset of nodes.
   * Collapses all nodes if no argument is provided.
   * Filter function should return `true` for nodes to collapse. If not provided, collapses all nodes.
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.collapseNodes((node) => node.id.startsWith('folder-'))}>
   *   Collapse Folders
   * </button>
   * ```
   */
  collapseNodes: (filterNode?: (node: Node) => boolean) => void;

  /**
   * Programmatically show a node by `id`.
   * By default, the matching node will be expanded, selected, and focused.
   * Use the options parameter to customize this behavior.
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.showNode('node-123')}>
   *   Show Node
   * </button>
   * <button on:click={() => treeView.showNode('node-123', { expand: false, focus: false })}>
   *   Show Node (No Expand/Focus)
   * </button>
   * ```
   */
  showNode: (id: TreeNodeId, options?: ShowNodeOptions) => void;
}
