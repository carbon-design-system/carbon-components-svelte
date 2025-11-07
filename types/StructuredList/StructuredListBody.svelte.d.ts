import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type StructuredListBodyProps = Omit<$RestProps, keyof $Props> & $Props;

export default class StructuredListBody extends SvelteComponentTyped<
  StructuredListBodyProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
