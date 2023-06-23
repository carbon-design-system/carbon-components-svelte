/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface SideNavMenuItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to select the item
   * @default false
   */
  isSelected?: boolean;

  /**
   * Specify the `href` attribute
   * @default undefined
   */
  href?: string;

  /**
   * Specify the item text
   * @default undefined
   */
  text?: string;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class SideNavMenuItem extends SvelteComponent<
  SideNavMenuItemProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
