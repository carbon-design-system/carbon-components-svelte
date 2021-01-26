/// <reference types="svelte" />
import { DataTableHeader } from "../DataTable/DataTable";

export interface DataTableSkeletonProps
  extends DataTableHeader,
    svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
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
  headers?: string[] | Partial<DataTableHeader>[];

  /**
   * Set to `false` to hide the toolbar
   * @default true
   */
  showToolbar?: boolean;
}

export default class DataTableSkeleton {
  $$prop_def: DataTableSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
