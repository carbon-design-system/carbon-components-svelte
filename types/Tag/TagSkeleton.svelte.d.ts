/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TagSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {
  /**
   * @default "default"
   */
  size?: "sm" | "default";
}

export default class TagSkeleton extends SvelteComponentTyped<
  TagSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
