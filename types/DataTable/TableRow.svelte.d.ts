import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["tr"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type TableRowProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TableRow extends SvelteComponentTyped<
  TableRowProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
