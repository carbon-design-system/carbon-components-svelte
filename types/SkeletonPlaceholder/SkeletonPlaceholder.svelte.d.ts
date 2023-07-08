/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SkeletonPlaceholderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class SkeletonPlaceholder extends SvelteComponentTyped<
  SkeletonPlaceholderProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
