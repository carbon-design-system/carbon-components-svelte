import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["thead"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type TableHeadProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TableHead extends SvelteComponentTyped<
  TableHeadProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
