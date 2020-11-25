/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface HeaderNavProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {
  /**
   * Specify the ARIA label for the nav
   */
  ariaLabel?: string;
}

export default class HeaderNav extends SvelteComponent<HeaderNavProps, {}, { default: {} }> {}
