/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface HeaderActionLinkProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to use the active state
   * @default false
   */
  linkIsActive?: boolean;

  /**
   * Specify the `href` attribute
   */
  href?: string;

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

export default class HeaderActionLink extends SvelteComponentTyped<
  HeaderActionLinkProps,
  {},
  {}
> {}
