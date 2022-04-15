/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

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

  /**
   * SvelteKit attribute to enable data prefetching
   * if a link is hovered over or touched on mobile.
   * @see https://kit.svelte.dev/docs/a-options#sveltekit-prefetch
   * @default false
   */
  "sveltekit:prefetch"?: boolean;

  /**
   * SvelteKit attribute to trigger a full page
   * reload after the link is clicked.
   * @see https://kit.svelte.dev/docs/a-options#sveltekit-reload
   * @default false
   */
  "sveltekit:reload"?: boolean;

  /**
   * SvelteKit attribute to prevent scrolling
   * after the link is clicked.
   * @see https://kit.svelte.dev/docs/a-options#sveltekit-noscroll
   * @default false
   */
  "sveltekit:noscroll"?: boolean;
}

export default class HeaderPanelLink extends SvelteComponentTyped<
  HeaderPanelLinkProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
