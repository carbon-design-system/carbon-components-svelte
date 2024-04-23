import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface StructuredListBodyProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class StructuredListBody extends SvelteComponentTyped<
  StructuredListBodyProps,
  Record<string, any>,
  { default: {} }
> {}
