import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["ol"];

export interface OrderedListProps extends RestProps {
  /**
   * Set to `true` to use native list styles
   * @default false
   */
  native?: boolean;

  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;

  /**
   * Set to `true` to use expressive type styles
   * @default false
   */
  expressive?: boolean;

  [key: `data-${string}`]: any;
}

export default class OrderedList extends SvelteComponentTyped<
  OrderedListProps,
  Record<string, any>,
  { default: {} }
> {}
