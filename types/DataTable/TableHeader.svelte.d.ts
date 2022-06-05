/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TableHeaderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["th"]> {
  /**
   * Set to `true` for the sortable variant
   * @default false
   */
  sortable?: boolean;

  /**
   * Specify the sort direction
   * @default "none"
   */
  sortDirection?: "none" | "ascending" | "descending";

  /**
   * Set to `true` if the column sorting
   * @default false
   */
  active?: boolean;

  /**
   * Specify the `scope` attribute
   * @default "col"
   */
  scope?: string;

  /**
   * Override the default id translations
   * @default () => ""
   */
  translateWithId?: () => string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class TableHeader extends SvelteComponentTyped<
  TableHeaderProps,
  {
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    click: WindowEventMap["click"];
  },
  { default: {} }
> {}
