/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface TableCellProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["td"]> {}

export default class TableCell extends SvelteComponent<
  TableCellProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
