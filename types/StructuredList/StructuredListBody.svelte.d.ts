/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface StructuredListBodyProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class StructuredListBody extends SvelteComponentTyped<
  StructuredListBodyProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
