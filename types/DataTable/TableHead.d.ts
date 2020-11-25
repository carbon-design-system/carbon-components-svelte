/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TableHeadProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["thead"]> {}

export default class TableHead extends SvelteComponent<
  TableHeadProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
