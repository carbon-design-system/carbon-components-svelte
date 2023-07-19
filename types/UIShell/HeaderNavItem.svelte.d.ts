import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["a"];

export interface HeaderNavItemProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class HeaderNavItem extends SvelteComponentTyped<
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
