/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface SearchSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the size of the search input
   * @default "xl"
   */
  size?: "sm" | "lg" | "xl";
}

export default class SearchSkeleton extends SvelteComponent<
  SearchSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
