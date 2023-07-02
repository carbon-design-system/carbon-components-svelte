/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface RadioButtonSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class RadioButtonSkeleton extends SvelteComponentTyped<
  RadioButtonSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
