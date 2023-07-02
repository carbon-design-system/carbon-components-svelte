/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TableCellProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["td"]> {
  [key: `data-${string}`]: any;
}

export default class TableCell extends SvelteComponentTyped<
  TableCellProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
