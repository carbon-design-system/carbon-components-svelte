/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface LinkProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]>,
    svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["p"]> {
  /**
   * Specify the size of the link
   * @default undefined
   */
  size?: "sm" | "lg";

  /**
   * Specify the href value
   * @default undefined
   */
  href?: string;

  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  /**
   * Specify the icon to render
   * `inline` must be `false`
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Set to `true` to disable the checkbox
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to allow visited styles
   * @default false
   */
  visited?: boolean;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLAnchorElement | HTMLParagraphElement;

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

export default class Link extends SvelteComponentTyped<
  LinkProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {}; icon: {} }
> {}
