/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SideNavMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the text
   * @default undefined
   */
  text?: string;

  /**
   * Specify the icon to render
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class SideNavMenu extends SvelteComponentTyped<
  SideNavMenuProps,
  { click: WindowEventMap["click"] },
  { default: {}; icon: {} }
> {}
