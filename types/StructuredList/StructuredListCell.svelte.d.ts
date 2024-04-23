import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface StructuredListCellProps extends RestProps {
  /**
   * Set to `true` to prevent wrapping
   * @default false
   */
  noWrap?: boolean;

  [key: `data-${string}`]: any;
}

export default class StructuredListCell extends SvelteComponentTyped<
  StructuredListCellProps,
  Record<string, any>,
  { default: {} }
> {}
