/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TabsSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of tabs to render
   * @default 4
   */
  count?: number;
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
