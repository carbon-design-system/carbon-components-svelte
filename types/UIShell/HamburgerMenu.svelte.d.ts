import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["button"];

type $Props = {
  /**
   * Specify the ARIA label for the button
   * @default undefined
   */
  ariaLabel?: string;

  /**
   * Set to `true` to toggle the open state
   * @default false
   */
  isOpen?: boolean;

  /**
   * Specify the icon to render for the closed state.
   * @default Menu
   */
  iconMenu?: any;

  /**
   * Specify the icon to render for the opened state.
   * @default Close
   */
  iconClose?: any;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  [key: `data-${string}`]: any;
};

export type HamburgerMenuProps = Omit<$RestProps, keyof $Props> & $Props;

export default class HamburgerMenu extends SvelteComponentTyped<
  HamburgerMenuProps,
  { click: WindowEventMap["click"] },
  Record<string, never>
> {}
