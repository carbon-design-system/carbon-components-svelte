import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["td"];

export interface TableCellProps extends RestProps {
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
