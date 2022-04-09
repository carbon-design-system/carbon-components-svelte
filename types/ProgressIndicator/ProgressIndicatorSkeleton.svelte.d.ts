/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ProgressIndicatorSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Set to `true` to use the vertical variant
   * @default false
   */
  vertical?: boolean;

  /**
   * Specify the number of steps to render
   * @default 4
   */
  count?: number;
}

export default class ProgressIndicatorSkeleton extends SvelteComponentTyped<
  ProgressIndicatorSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
