import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["input"];

type $Props<
  Row extends import("./DataTable.svelte").DataTableRow<any> =
    import("./DataTable.svelte").DataTableRow<any>,
> = {
  /**
   * Specify the value of the search input.
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
  shouldFilterRows?: boolean | ((row: Row, value: number | string) => boolean);

  /**
   * The filtered row ids.
   * @default []
   */
  filteredRowIds?: ReadonlyArray<Row["id"]>;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Obtain a reference to the input HTML element.
   * @default null
   */
  ref?: null | HTMLInputElement;

  [key: `data-${string}`]: any;
};

export type ToolbarSearchProps<
  Row extends import("./DataTable.svelte").DataTableRow<any> =
    import("./DataTable.svelte").DataTableRow<any>,
> = Omit<$RestProps, keyof $Props<Row>> & $Props<Row>;

export default class ToolbarSearch<
  Row extends import("./DataTable.svelte").DataTableRow<any> =
    import("./DataTable.svelte").DataTableRow<any>,
> extends SvelteComponentTyped<
  ToolbarSearchProps<Row>,
  {
    clear: CustomEvent<null>;
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    keyup: WindowEventMap["keyup"];
    keydown: WindowEventMap["keydown"];
    paste: WindowEventMap["paste"];
  },
  Record<string, never>
> {}
