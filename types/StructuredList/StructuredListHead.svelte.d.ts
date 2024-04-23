import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface StructuredListHeadProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class StructuredListHead extends SvelteComponentTyped<
  StructuredListHeadProps,
  Record<string, any>,
  { default: {} }
> {}
