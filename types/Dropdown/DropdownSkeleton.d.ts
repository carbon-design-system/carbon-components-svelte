/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface DropdownSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;
}

export default class DropdownSkeleton extends SvelteComponent<
  DropdownSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
