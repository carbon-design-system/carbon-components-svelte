/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface SelectSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class SelectSkeleton extends SvelteComponent<
  SelectSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
