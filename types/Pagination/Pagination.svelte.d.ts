/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface PaginationProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the current page index
   * @default 1
   */
  page?: number;

  /**
   * Specify the total number of items
   * @default 0
   */
  totalItems?: number;

  /**
   * Set to `true` to disable the pagination
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the forward button text
   * @default "Next page"
   */
  forwardText?: string;

  /**
   * Specify the backward button text
   * @default "Previous page"
   */
  backwardText?: string;

  /**
   * Specify the items per page text
   * @default "Items per page:"
   */
  itemsPerPageText?: string;

  /**
   * Override the item text
   * @default (min, max) => `${min}–${max} items`
   */
  itemText?: (min: number, max: number) => string;

  /**
   * Override the item range text
   * @default (min, max, total) => `${min}–${max} of ${total} items`
   */
  itemRangeText?: (min: number, max: number, total: number) => string;

  /**
   * Set to `true` to disable the page input
   * @default false
   */
  pageInputDisabled?: boolean;

  /**
   * Set to `true` to disable the page size input
   * @default false
   */
  pageSizeInputDisabled?: boolean;

  /**
   * Specify the number of items to display in a page
   * @default 10
   */
  pageSize?: number;

  /**
   * Specify the available page sizes
   * @default [10]
   */
  pageSizes?: number[];

  /**
   * Set to `true` if the number of pages is unknown
   * @default false
   */
  pagesUnknown?: boolean;

  /**
   * Override the page text
   * @default (page) => `page ${page}`
   */
  pageText?: (page: number) => string;

  /**
   * Override the page range text
   * @default (current, total) => `of ${total} page${total === 1 ? "" : "s"}`
   */
  pageRangeText?: (current: number, total: number) => string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class Pagination extends SvelteComponentTyped<
  PaginationProps,
  {
    update: CustomEvent<{ pageSize: number; page: number }>;
    ["click:button--previous"]: CustomEvent<{ page: number }>;
    ["click:button--next"]: CustomEvent<{ page: number }>;
  },
  {}
> {}
