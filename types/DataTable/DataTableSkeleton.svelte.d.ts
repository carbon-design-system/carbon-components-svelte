import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

import type { DataTableHeader } from "./DataTable.svelte";

type RestProps = SvelteHTMLElements["div"];

export interface DataTableSkeletonProps extends DataTableHeader, RestProps {
  /**
   * Specify the number of columns
   * Superseded by `headers` if `headers` is a non-empty array
   * @default 5
   */
  columns?: number;

  /**
   * Specify the number of rows
   * @default 5
   */
  rows?: number;

  /**
   * Set the size of the data table
   * @default undefined
   */
  size?: "compact" | "short" | "tall";

  /**
   * Set to `true` to apply zebra styles to the datatable rows
   * @default false
   */
  zebra?: boolean;

  /**
   * Set to `false` to hide the header
   * @default true
   */
  showHeader?: boolean;

  /**
   * Set the column headers
   * Supersedes `columns` if value is a non-empty array
   * @default []
   */
  headers?: ReadonlyArray<string | Partial<DataTableHeader>>;

  /**
   * Set to `false` to hide the toolbar
   * @default true
   */
  showToolbar?: boolean;

  [key: `data-${string}`]: any;
}

export default class DataTableSkeleton extends SvelteComponentTyped<
  DataTableSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
