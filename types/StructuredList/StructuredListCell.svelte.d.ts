/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface StructuredListCellProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
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

  [key: `data-${string}`]: any;
}

export default class StructuredListCell extends SvelteComponentTyped<
  StructuredListCellProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
