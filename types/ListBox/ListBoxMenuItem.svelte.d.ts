/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ListBoxMenuItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to enable the active state
   * @default false
   */
  active?: boolean;

  /**
   * Set to `true` to enable the highlighted state
   * @default false
   */
  highlighted?: boolean;

  /**
   * Set to `true` to disable the menu item
   * @default false
   */
  disabled?: boolean;
}

export default class ListBoxMenuItem extends SvelteComponentTyped<
  ListBoxMenuItemProps,
  {
    click: WindowEventMap["click"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
