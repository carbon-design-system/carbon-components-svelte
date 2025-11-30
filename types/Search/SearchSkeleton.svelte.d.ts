import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the size of the search input.
   * @default "xl"
   */
  size?: "sm" | "lg" | "xl";

  [key: `data-${string}`]: any;
};

export type SearchSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SearchSkeleton extends SvelteComponentTyped<
  SearchSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
