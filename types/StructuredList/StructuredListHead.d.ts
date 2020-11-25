/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface StructuredListHeadProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class StructuredListHead extends SvelteComponent<
  StructuredListHeadProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
