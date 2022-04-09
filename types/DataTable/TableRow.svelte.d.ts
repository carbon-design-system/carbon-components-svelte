/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TableRowProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tr"]> {}

export default class TableRow extends SvelteComponentTyped<
  TableRowProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
