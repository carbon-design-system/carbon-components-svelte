import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["tbody"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type TableBodyProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TableBody extends SvelteComponentTyped<
  TableBodyProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
