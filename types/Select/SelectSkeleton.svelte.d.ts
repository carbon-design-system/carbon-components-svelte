import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface SelectSkeletonProps extends RestProps {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;

  [key: `data-${string}`]: any;
}

export default class SelectSkeleton extends SvelteComponentTyped<
  SelectSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
