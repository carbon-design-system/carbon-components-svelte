import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type StructuredListHeadProps = Omit<$RestProps, keyof $Props> & $Props;

export default class StructuredListHead extends SvelteComponentTyped<
  StructuredListHeadProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
