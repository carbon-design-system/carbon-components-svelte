import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the number of rows
   * @default 5
   */
  rows?: number;

  [key: `data-${string}`]: any;
};

export type StructuredListSkeletonProps = Omit<$RestProps, keyof $Props> &
  $Props;

export default class StructuredListSkeleton extends SvelteComponentTyped<
  StructuredListSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
