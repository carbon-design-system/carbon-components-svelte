/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface HeaderNavItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Specify the `href` attribute
   * @default undefined
   */
  href?: string;

  /**
   * Specify the text
   * @default undefined
   */
  text?: string;

  /**
   * Set to `true` to select the item
   * @default false
   */
  isSelected?: boolean;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class HeaderNavItem extends SvelteComponent<
  HeaderNavItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keyup: WindowEventMap["keyup"];
    keydown: WindowEventMap["keydown"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { default: {} }
> {}
