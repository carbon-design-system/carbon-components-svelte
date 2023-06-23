/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface BreadcrumbSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to hide the breadcrumb trailing slash
   * @default false
   */
  noTrailingSlash?: boolean;

  /**
   * Specify the number of breadcrumb items to render
   * @default 3
   */
  count?: number;
}

export default class BreadcrumbSkeleton extends SvelteComponent<
  BreadcrumbSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
