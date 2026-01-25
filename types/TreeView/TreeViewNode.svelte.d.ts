import { SvelteComponentTyped } from "svelte";

/**
 * Computes the depth of a tree leaf node relative to <ul role="tree" />.
 * Returns the depth of the node (0-based, where 0 is the root level).
 * @example
 * ```svelte
 * import { computeTreeLeafDepth } from 'carbon-components-svelte/TreeView/TreeViewNode.svelte';
 * let nodeElement;
 * $: depth = computeTreeLeafDepth(nodeElement);
 *
 * <li bind:this={nodeElement}>Node at depth {depth}</li>
 * ```
 */
export declare function computeTreeLeafDepth(
  node: HTMLLIElement | null,
): number;

export type TreeViewNodeProps<Id = string | number> = {
  /**
   * @generics Id
   * @template Id
   * @default false
   */
  leaf?: boolean;

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
        node: {
          id: Id;
          text: string;
          expanded: false;
          leaf: boolean;
          disabled: boolean;
          selected: boolean;
        };
      },
    ]
  ) => void;
};

export default class TreeViewNode<
  Id = string | number,
> extends SvelteComponentTyped<
  TreeViewNodeProps<Id>,
  Record<string, any>,
  {
    default: {
      node: {
        id: Id;
        text: string;
        expanded: false;
        leaf: boolean;
        disabled: boolean;
        selected: boolean;
      };
    };
  }
> {}
