/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface OverflowMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Specify the size of the overflow menu
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Specify the direction of the overflow menu relative to the button
   * @default "bottom"
   */
  direction?: "top" | "bottom";

  /**
   * Set to `true` to open the menu
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to flip the menu relative to the button
   * @default false
   */
  flipped?: boolean;

  /**
   * Specify the menu options class
   * @default undefined
   */
  menuOptionsClass?: string;

  /**
   * Specify the icon to render.
   * Defaults to `<OverflowMenuVertical />`
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Specify the icon class
   * @default undefined
   */
  iconClass?: string;

  /**
   * Specify the ARIA label for the icon
   * @default "Open and close list of options"
   */
  iconDescription?: string;

  /**
   * Set an id for the button element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the trigger button element
   * @default null
   */
  buttonRef?: null | HTMLButtonElement;

  /**
   * Obtain a reference to the overflow menu element
   * @default null
   */
  menuRef?: null | HTMLUListElement;
}

export default class OverflowMenu extends SvelteComponentTyped<
  OverflowMenuProps,
  {
    close: CustomEvent<null | { index: number; text: string }>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: {}; menu: {} }
> {}
