/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface TabsSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of tabs to render
   * @default 4
   */
  count?: number;

  /**
   * Specify the type of tabs
   * @default "default"
   */
  type?: "default" | "container";
}

export default class TabsSkeleton extends SvelteComponent<
  TabsSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
