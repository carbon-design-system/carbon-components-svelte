/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface HeaderNavMenuProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
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
   */
  text?: string;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Expand/Collapse"
   */
  iconDescription?: string;
}

export default class HeaderNavMenu extends SvelteComponent<
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
