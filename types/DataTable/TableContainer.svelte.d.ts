/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TableContainerProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the title of the data table
   * @default ""
   */
  title?: string;

  /**
   * Specify the description of the data table
   * @default ""
   */
  description?: string;

  /**
   * Set to `true` to enable a sticky header
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Set to `true` to use static width
   * @default false
   */
  useStaticWidth?: boolean;
}

export default class TableContainer extends SvelteComponentTyped<
  TableContainerProps,
  {},
  { default: {} }
> {}
