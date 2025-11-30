import { SvelteComponentTyped } from "svelte";

export type TreeNodeId = string | number;

export interface TreeNode {
  id: TreeNodeId;
  text: string;
  disabled?: boolean;
  expanded?: boolean;
}

export type TreeViewNodeListProps = {
  /**
   * @default []
   */
  nodes?: ReadonlyArray<TreeNode & { nodes?: TreeNode[] }>;

  /**
   * @default false
   */
  root?: boolean;

  /**
   * @default ""
   */
  id?: string | number;

  /**
   * @default ""
   */
  text?: string;

  /**
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the icon to render.
   * @default undefined
   */
  icon?: any;
};

export default class TreeViewNodeList extends SvelteComponentTyped<
  TreeViewNodeListProps,
  Record<string, any>,
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
  }
> {}
