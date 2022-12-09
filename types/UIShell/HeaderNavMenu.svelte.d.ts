/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface HeaderNavMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the `href` attribute
   * @default "/"
   */
  href?: string;

  /**
   * Specify the text
   * @default undefined
   */
  text?: string;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class HeaderNavMenu extends SvelteComponentTyped<
  HeaderNavMenuProps,
  {
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { default: {} }
> {}
