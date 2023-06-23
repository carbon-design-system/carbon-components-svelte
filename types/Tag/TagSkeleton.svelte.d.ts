/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface TagSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {
  /**
   * @default "default"
   */
  size?: "sm" | "default";
}

export default class TagSkeleton extends SvelteComponent<
  TagSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
