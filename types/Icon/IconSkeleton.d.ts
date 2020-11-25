/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface IconSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the size of the icon
   * @default 16
   */
  size?: number;
}

export default class IconSkeleton extends SvelteComponent<
  IconSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
