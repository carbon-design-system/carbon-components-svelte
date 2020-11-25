/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface DatePickerSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to use the range variant
   * @default false
   */
  range?: boolean;

  /**
   * Set an id to be used by the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class DatePickerSkeleton extends SvelteComponent<
  DatePickerSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
