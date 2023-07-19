import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["input"];

export interface ToolbarSearchProps extends RestProps {
  /**
   * Specify the value of the search input
   * @default ""
   */
  value?: number | string;

  /**
   * Set to `true` to expand the search bar
   * @default false
   */
  expanded?: boolean;

  /**
   * Set to `true` to keep the search bar expanded
   * @default false
   */
  persistent?: boolean;

  /**
   * Set to `true` to disable the search bar
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to filter table rows using the search value.
   *
   * If `true`, the default search excludes `id`, `cells` fields and
   * only does a basic comparison on string and number type cell values.
   *
   * To implement your own client-side filtering, pass a function
   * that accepts a row and value and returns a boolean.
   * @default false
   */
  shouldFilterRows?:
    | boolean
    | ((
        row: import("./DataTable.svelte").DataTableRow,
        value: number | string
      ) => boolean);

  /**
   * The filtered row ids
   * @default []
   */
  filteredRowIds?: ReadonlyArray<import("./DataTable.svelte").DataTableRowId>;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  [key: `data-${string}`]: any;
}

export default class ToolbarSearch extends SvelteComponentTyped<
  ToolbarSearchProps,
  {
    clear: WindowEventMap["clear"];
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    keyup: WindowEventMap["keyup"];
    keydown: WindowEventMap["keydown"];
    paste: DocumentAndElementEventHandlersEventMap["paste"];
  },
  {}
> {}
