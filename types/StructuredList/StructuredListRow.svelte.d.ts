import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["svelte:element"];

export interface StructuredListRowProps extends RestProps {
  /**
   * Specify the tag name
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  /**
   * Set to `true` to use the selected state
   * @default false
   */
  selected?: boolean;

  [key: `data-${string}`]: any;
}

export default class StructuredListRow extends SvelteComponentTyped<
  StructuredListRowProps,
  Record<string, any>,
  { default: {} }
> {}
