import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
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
};

export type BreadcrumbSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class BreadcrumbSkeleton extends SvelteComponentTyped<
  BreadcrumbSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
