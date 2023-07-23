import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["li"];

export interface OverflowMenuItemProps extends RestProps {
  /**
   * Specify the item text.
   * Alternatively, use the default slot
   * @default "Provide text"
   */
  text?: string;

  /**
   * Specify the `href` attribute if the item is a link
   * @default ""
   */
  href?: string;

  /**
   * Set to `true` if the item should be focused when opening the menu
   * @default false
   */
  primaryFocus?: boolean;

  /**
   * Set to `true` to disable the item
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to include a divider
   * @default false
   */
  hasDivider?: boolean;

  /**
   * Set to `true` to use the danger variant
   * @default false
   */
  danger?: boolean;

  /**
   * Set to `false` to omit the button `title` attribute
   * @default true
   */
  requireTitle?: boolean;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLAnchorElement | HTMLButtonElement;

  [key: `data-${string}`]: any;
}

export default class OverflowMenuItem extends SvelteComponentTyped<
  OverflowMenuItemProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  { default: {} }
> {}
