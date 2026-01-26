import { SvelteComponentTyped } from "svelte";

export interface TreeNode<Id> {
  id: Id;
  text: string;
  disabled?: boolean;
  expanded?: boolean;
}

export type TreeViewNodeListProps<Id = string | number> = {
  /**
   * @default []
   */
  nodes?: ReadonlyArray<TreeNode<Id> & { nodes?: TreeNode<Id>[] }>;

  /**
   * @default false
   */
  root?: boolean;

  /**
   * @default ""
   */
  id?: Id;

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

  children?: (
    this: void,
    ...args: [
      {
        node: TreeNode<Id> & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
        };
      },
    ]
  ) => void;
};

export default class TreeViewNodeList<
  Id = string | number,
> extends SvelteComponentTyped<
  TreeViewNodeListProps<Id>,
  Record<string, any>,
  {
    default: {
      node: TreeNode<Id> & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      };
    };
  }
> {}
