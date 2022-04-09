/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SkeletonTextProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of lines to render
   * @default 3
   */
  lines?: number;

  /**
   * Set to `true` to use the heading size variant
   * @default false
   */
  heading?: boolean;

  /**
   * Set to `true` to use the paragraph size variant
   * @default false
   */
  paragraph?: boolean;

  /**
   * Specify the width of the text (% or px)
   * @default "100%"
   */
  width?: string;
}

export default class SkeletonText extends SvelteComponentTyped<
  SkeletonTextProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
