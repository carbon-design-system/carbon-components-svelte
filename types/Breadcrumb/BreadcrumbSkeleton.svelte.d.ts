import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface BreadcrumbSkeletonProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class BreadcrumbSkeleton extends SvelteComponentTyped<
  BreadcrumbSkeletonProps,
  Record<string, any>,
  {}
> {}
