/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface SideNavLinkProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
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
   * Specify the icon to render
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class SideNavLink extends SvelteComponentTyped<
  SideNavLinkProps,
  { click: WindowEventMap["click"] },
  {}
> {}
