import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface SearchSkeletonProps extends RestProps {
  /**
   * Specify the size of the search input
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  [key: `data-${string}`]: any;
}

export default class SearchSkeleton extends SvelteComponentTyped<
  SearchSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
