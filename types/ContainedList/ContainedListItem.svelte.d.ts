import { SvelteComponentTyped } from "svelte";

export type ContainedListItemProps = {
  /**
   * Set to `true` to render a `button` element instead of a `div`
   * @default false
   */
  interactive?: boolean;

  /**
   * Set to `true` to disable the list item
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the item content.
   * @default undefined
   */
  icon?: any;

  action?: (this: void) => void;
};

export default class ContainedListItem extends SvelteComponentTyped<
  ContainedListItemProps,
  { click: WindowEventMap["click"] },
  { default: Record<string, never>; action: Record<string, never> }
> {}
