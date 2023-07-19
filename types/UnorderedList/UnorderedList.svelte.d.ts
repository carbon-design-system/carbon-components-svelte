import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["ul"];

export interface UnorderedListProps extends RestProps {
  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;

  /**
   * Set to `true` to use Carbon's expressive typesetting
   * @default false
   */
  expressive?: boolean;

  [key: `data-${string}`]: any;
}

export default class UnorderedList extends SvelteComponentTyped<
  UnorderedListProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
