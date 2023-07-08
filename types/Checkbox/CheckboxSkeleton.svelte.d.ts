/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface CheckboxSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class CheckboxSkeleton extends SvelteComponentTyped<
  CheckboxSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
