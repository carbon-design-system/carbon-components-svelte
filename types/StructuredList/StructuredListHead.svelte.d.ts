/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface StructuredListHeadProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class StructuredListHead extends SvelteComponentTyped<
  StructuredListHeadProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
