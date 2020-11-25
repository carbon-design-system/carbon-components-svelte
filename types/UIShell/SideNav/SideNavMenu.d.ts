/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface SideNavMenuProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
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
   * Specify the icon props
   */
  icon?: { render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean };

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class SideNavMenu extends SvelteComponent<
  SideNavMenuProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
