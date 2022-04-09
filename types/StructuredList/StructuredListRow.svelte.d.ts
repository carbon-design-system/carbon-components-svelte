/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface StructuredListRowProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["label"]> {
  /**
   * Set to `true` to use as a header
   * @default false
   */
  head?: boolean;

  /**
   * Set to `true` to render a label slot
   * @default false
   */
  label?: boolean;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;
}

export default class StructuredListRow extends SvelteComponentTyped<
  StructuredListRowProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: {} }
> {}
