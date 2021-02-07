/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface SideNavMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the text
   */
  text?: string;

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class SideNavMenu extends SvelteComponentTyped<
  SideNavMenuProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
