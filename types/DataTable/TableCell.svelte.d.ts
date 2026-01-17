import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["td"];

type $Props = {
  children?: (this: void) => void;

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
  { default: Record<string, never> }
> {}
