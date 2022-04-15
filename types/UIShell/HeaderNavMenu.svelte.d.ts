/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface HeaderNavMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the `href` attribute
   * @default "/"
   */
  href?: string;

  /**
   * Specify the text
   * @default undefined
   */
  text?: string;

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

export default class HeaderNavMenu extends SvelteComponentTyped<
  HeaderNavMenuProps,
  {
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { default: {} }
> {}
