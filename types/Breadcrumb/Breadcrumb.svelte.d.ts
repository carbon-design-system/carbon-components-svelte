/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";
import type { BreadcrumbSkeletonProps } from "./BreadcrumbSkeleton.svelte";

export interface BreadcrumbProps extends BreadcrumbSkeletonProps {
  /**
   * Set to `true` to hide the breadcrumb trailing slash
   * @default false
   */
  noTrailingSlash?: boolean;

  /**
   * Set to `true` to display skeleton state
   * @default false
   */
  skeleton?: boolean;
}

export default class Breadcrumb extends SvelteComponentTyped<
  BreadcrumbProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
