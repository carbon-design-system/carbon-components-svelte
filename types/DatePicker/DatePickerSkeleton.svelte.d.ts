import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to use the range variant
   * @default false
   */
  range?: boolean;

  /**
   * Set an id to be used by the label element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  [key: `data-${string}`]: any;
};

export type DatePickerSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class DatePickerSkeleton extends SvelteComponentTyped<
  DatePickerSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
