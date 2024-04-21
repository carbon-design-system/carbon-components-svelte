import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["ul"];

export interface UnorderedListProps extends RestProps {
  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;

  /**
   * Set to `true` to use expressive type styles
   * @default false
   */
  expressive?: boolean;

  [key: `data-${string}`]: any;
}

export default class UnorderedList extends SvelteComponentTyped<
  UnorderedListProps,
  Record<string, any>,
  { default: {} }
> {}
