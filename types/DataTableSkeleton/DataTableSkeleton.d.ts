/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface DataTableSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["table"]> {
  /**
   * Specify the number of columns
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
   * If `headers` has one more items, `count` is ignored
   * @default []
   */
  headers?: string[];

  /**
   * Set to `false` to hide the toolbar
   * @default true
   */
  showToolbar?: boolean;
}

export default class DataTableSkeleton extends SvelteComponent<
  DataTableSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
