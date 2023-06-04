/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface DropdownSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  [key: `data-${string}`]: any;
}

export default class DropdownSkeleton extends SvelteComponentTyped<
  DropdownSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
