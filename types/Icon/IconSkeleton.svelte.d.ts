/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface IconSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the size of the icon
   * @default 16
   */
  size?: number;
}

export default class IconSkeleton extends SvelteComponentTyped<
  IconSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
