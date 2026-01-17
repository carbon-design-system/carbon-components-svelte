import { SvelteComponentTyped } from "svelte";

/**
 * Computes the depth of a tree leaf node relative to <ul role="tree" />.
 * Returns the depth of the node (0-based, where 0 is the root level).
 * @example ```svelte
 *
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
export type TreeNodeId = string | number;

export type TreeViewNodeProps = {
  /**
   * @default false
   */
  leaf?: boolean;

  /**
   * @default ""
   */
  id?: TreeNodeId;

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

export default class TreeViewNode extends SvelteComponentTyped<
  TreeViewNodeProps,
  Record<string, any>,
  {
    default: {
      node: {
        id: TreeNodeId;
        text: string;
        expanded: false;
        leaf: boolean;
        disabled: boolean;
        selected: boolean;
      };
    };
  }
> {}
