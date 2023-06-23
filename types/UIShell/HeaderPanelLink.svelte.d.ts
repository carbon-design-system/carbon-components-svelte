/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface HeaderPanelLinkProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Specify the `href` attribute
   * @default undefined
   */
  href?: string;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class HeaderPanelLink extends SvelteComponent<
  HeaderPanelLinkProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
