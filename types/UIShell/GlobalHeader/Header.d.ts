/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface HeaderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `false` to hide the side nav by default
   * @default true
   */
  expandedByDefault?: boolean;

  /**
   * Set to `true` to open the side nav
   * @default false
   */
  isSideNavOpen?: boolean;

  /**
   * Specify the ARIA label for the header
   */
  uiShellAriaLabel?: string;

  /**
   * Specify the `href` attribute
   */
  href?: string;

  /**
   * Specify the company name
   */
  company?: string;

  /**
   * Specify the platform name
   * Alternatively, use the named slot "platform" (e.g., <span slot="platform">...</span>)
   * @default ""
   */
  platformName?: string;

  /**
   * Set to `true` to persist the hamburger menu
   * @default false
   */
  persistentHamburgerMenu?: boolean;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class Header extends SvelteComponentTyped<
  HeaderProps,
  { click: WindowEventMap["click"] },
  { default: {}; platform: {}; ["skip-to-content"]: {} }
> {}
