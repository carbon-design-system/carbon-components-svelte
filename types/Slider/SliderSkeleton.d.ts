/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface SliderSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class SliderSkeleton extends SvelteComponent<
  SliderSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
