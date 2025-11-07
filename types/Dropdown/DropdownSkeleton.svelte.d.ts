import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  [key: `data-${string}`]: any;
};

export type DropdownSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class DropdownSkeleton extends SvelteComponentTyped<
  DropdownSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
