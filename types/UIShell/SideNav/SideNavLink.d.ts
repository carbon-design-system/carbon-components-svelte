/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface SideNavLinkProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to select the current link
   * @default false
   */
  isSelected?: boolean;

  /**
   * Specify the `href` attribute
   */
  href?: string;

  /**
   * Specify the text
   */
  text?: string;

  /**
   * Specify the icon props
   */
  icon?: { render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean };

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class SideNavLink extends SvelteComponent<SideNavLinkProps, { click: WindowEventMap["click"] }, {}> {}
