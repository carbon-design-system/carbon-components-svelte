import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["section"];

export interface TableProps extends RestProps {
  /**
   * Set the size of the table
   * @default undefined
   */
  size?: "compact" | "short" | "medium" | "tall";

  /**
   * Set to `true` to use zebra styles
   * @default false
   */
  zebra?: boolean;

  /**
   * Set to `true` to use static width
   * @default false
   */
  useStaticWidth?: boolean;

  /**
   * Set to `true` for the sortable variant
   * @default false
   */
  sortable?: boolean;

  /**
   * Set to `true` to enable a sticky header
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Set the style attribute on the `table` element
   * @default undefined
   */
  tableStyle?: string;

  [key: `data-${string}`]: any;
}

export default class Table extends SvelteComponentTyped<
  TableProps,
  Record<string, any>,
  { default: {} }
> {}
