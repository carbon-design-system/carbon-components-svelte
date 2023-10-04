import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["a"];

export interface HeaderProps extends RestProps {
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
   * @default undefined
   */
  uiShellAriaLabel?: string;

  /**
   * Specify the `href` attribute
   * @default undefined
   */
  href?: string;

  /**
   * Specify the company name.
   * Alternatively, use the named slot "company" (e.g., `<span slot="company">...</span>`)
   * @default undefined
   */
  company?: string;

  /**
   * Specify the platform name.
   * Alternatively, use the named slot "platform" (e.g., `<span slot="platform">...</span>`)
   * @default ""
   */
  platformName?: string;

  /**
   * Set to `true` to persist the hamburger menu
   * @default false
   */
  persistentHamburgerMenu?: boolean;

  /**
   * The window width (px) at which the SideNav is expanded and the hamburger menu is hidden.
   * 1056 represents the "large" breakpoint in pixels from the Carbon Design System:
   * - small: 320
   * - medium: 672
   * - large: 1056
   * - x-large: 1312
   * - max: 1584
   * @default 1056
   */
  expansionBreakpoint?: number;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;

  /**
   * Specify the icon to render for the closed state.
   * Defaults to `<Menu size={20} />`
   * @default undefined
   */
  iconMenu?: typeof import("svelte").SvelteComponent<any>;

  /**
   * Specify the icon to render for the opened state.
   * Defaults to `<Close size={20} />`
   * @default undefined
   */
  iconClose?: typeof import("svelte").SvelteComponent<any>;

  [key: `data-${string}`]: any;
}

export default class Header extends SvelteComponentTyped<
  HeaderProps,
  { click: WindowEventMap["click"] },
  { default: {}; company: {}; platform: {}; ["skip-to-content"]: {} }
> {}
