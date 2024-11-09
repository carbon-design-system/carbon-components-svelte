import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["ol"];

type $Props = {
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

  [key: `data-${string}`]: any;
};

export type OrderedListProps = Omit<$RestProps, keyof $Props> & $Props;

export default class OrderedList extends SvelteComponentTyped<
  OrderedListProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
