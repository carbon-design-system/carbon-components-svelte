import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["ul"];

export interface ProgressIndicatorSkeletonProps extends RestProps {
  /**
   * Set to `true` to use the vertical variant
   * @default false
   */
  vertical?: boolean;

  /**
   * Specify the number of steps to render
   * @default 4
   */
  count?: number;

  [key: `data-${string}`]: any;
}

export default class ProgressIndicatorSkeleton extends SvelteComponentTyped<
  ProgressIndicatorSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
