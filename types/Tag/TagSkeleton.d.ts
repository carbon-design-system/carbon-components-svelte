/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TagSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {}

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
