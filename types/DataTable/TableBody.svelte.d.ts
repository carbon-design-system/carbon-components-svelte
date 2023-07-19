import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["tbody"];

export interface TableBodyProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class TableBody extends SvelteComponentTyped<
  TableBodyProps,
  Record<string, any>,
  { default: {} }
> {}
