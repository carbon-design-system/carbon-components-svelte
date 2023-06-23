/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface OrderedListProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ol"]> {
  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;

  /**
   * Set to `true` to use native list styles
   * @default false
   */
  native?: boolean;

  /**
   * Set to `true` to use Carbon's expressive typesetting
   * @default false
   */
  expressive?: boolean;
}

export default class OrderedList extends SvelteComponent<
  OrderedListProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
