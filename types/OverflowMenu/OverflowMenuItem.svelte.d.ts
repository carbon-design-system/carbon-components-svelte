import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  /**
   * Specify the item text.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <span>Custom Text</span>
   * </OverflowMenuItem>
   * ```
   * @default "Provide text"
   */
  text?: string;

  /**
   * Specify the `href` attribute if the item is a link
   * @default ""
   */
  href?: string;

  /**
   * Specify the `target` attribute if the item is a link
   * @default ""
   */
  target?: HTMLAnchorElement["target"];

  /**
   * Specify the `rel` attribute if the item is a link.
   * By default, `noopener noreferrer` is added if
   * `target="_blank"` unless `rel` is specified.
   * @default undefined
   */
  rel?: HTMLAnchorElement["rel"];

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
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLAnchorElement | HTMLButtonElement;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type OverflowMenuItemProps = Omit<$RestProps, keyof $Props> & $Props;

export default class OverflowMenuItem extends SvelteComponentTyped<
  OverflowMenuItemProps,
  { click: CustomEvent<MouseEvent>; keydown: WindowEventMap["keydown"] },
  { default: Record<string, never> }
> {}
