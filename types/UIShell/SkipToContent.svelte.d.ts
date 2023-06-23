/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface SkipToContentProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Specify the `href` attribute
   * @default "#main-content"
   */
  href?: string;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;
}

export default class SkipToContent extends SvelteComponent<
  SkipToContentProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
