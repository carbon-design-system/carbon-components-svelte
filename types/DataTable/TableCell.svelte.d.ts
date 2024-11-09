import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["td"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type TableCellProps = Omit<$RestProps, keyof $Props> & $Props;

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
