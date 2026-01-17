import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["a"];

type $Props = {
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
   * Specify the ARIA label for the header.
   * @default undefined
   */
  uiShellAriaLabel?: string;

  /**
   * Specify the `href` attribute.
   * @default undefined
   */
  href?: string;

  /**
   * Specify the company name.
   *
   * Alternatively, use the named slot "company".
   * @example ```svelte
   *
   * <Header>
   *   <span slot="company">IBM</span>
   * </Header>
   * ```
   * @default undefined
   */
  companyName?: string;

  /**
   * Specify the platform name.
   * Alternatively, use the named slot "platform".
   * @example ```svelte
   *
   * <Header>
   *   <span slot="platform">Platform Name</span>
   * </Header>
   * ```
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
   * - max: 1584.
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
   * @default Menu
   */
  iconMenu?: any;

  /**
   * Specify the icon to render for the opened state.
   * @default Close
   */
  iconClose?: any;

  /**
   * Specify the ARIA label for the hamburger menu.
   * Defaults to "Open menu" or "Close menu" based on `isSideNavOpen` state.
   * @default undefined
   */
  ariaLabelMenu?: string;

  company?: (this: void) => void;

  platform?: (this: void) => void;

  "skip-to-content"?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type HeaderProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Header extends SvelteComponentTyped<
  HeaderProps,
  { click: WindowEventMap["click"] },
  {
    company: Record<string, never>;
    platform: Record<string, never>;
    "skip-to-content": Record<string, never>;
    default: Record<string, never>;
  }
> {}
