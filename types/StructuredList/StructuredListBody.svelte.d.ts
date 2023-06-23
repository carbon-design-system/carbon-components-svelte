/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface StructuredListBodyProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class StructuredListBody extends SvelteComponent<
  StructuredListBodyProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
