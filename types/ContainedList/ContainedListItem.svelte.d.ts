import type { SvelteComponentTyped } from "svelte";

export interface ContainedListItemProps {
  /**
   * Set to `true` to render a `button` element instead of a `div`
   * @default false
   */
  interactive?: boolean;

  /**
   * Set to `true` to disable the list item.
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the icon to render
   * Icon is rendered to the left of the label text
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent<any>;
}

export default class ContainedListItem extends SvelteComponentTyped<
  ContainedListItemProps,
  { click: WindowEventMap["click"] },
  { default: {}; action: {} }
> {}
