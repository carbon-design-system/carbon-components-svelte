import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to use as a header
   * @default false
   */
  head?: boolean;

  /**
   * Set to `true` to prevent wrapping
   * @default false
   */
  noWrap?: boolean;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type StructuredListCellProps = Omit<$RestProps, keyof $Props> & $Props;

export default class StructuredListCell extends SvelteComponentTyped<
  StructuredListCellProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
