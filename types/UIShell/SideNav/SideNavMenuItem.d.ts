/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface SideNavMenuItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to select the item
   */
  isSelected?: boolean;

  /**
   * Specify the `href` attribute
   */
  href?: string;

  /**
   * Specify the item text
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
  {}
> {}
