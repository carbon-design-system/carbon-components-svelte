/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface SkeletonPlaceholderProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class SkeletonPlaceholder extends SvelteComponent<
  SkeletonPlaceholderProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
