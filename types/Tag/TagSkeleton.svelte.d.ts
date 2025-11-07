import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["span"];

type $Props = {
  /**
   * @default "default"
   */
  size?: "sm" | "default";

  [key: `data-${string}`]: any;
};

export type TagSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TagSkeleton extends SvelteComponentTyped<
  TagSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
