import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
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
   * If `totalItems` is a large number, it can affect the
   * rendering performance of this component since its value
   * is used to calculate the number of pages in the native
   * select dropdown. This value creates a small window of
   * pages rendered around the current page. By default,
   * a maximum of 1000 select items are rendered.
   * @default 1000
   */
  pageWindow?: number;

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
   * Override the item text.
   */
  itemText?: (min: number, max: number) => string;

  /**
   * Override the item range text.
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
   * Specify the available page sizes.
   * @default [10]
   */
  pageSizes?: ReadonlyArray<number>;

  /**
   * Set to `true` if the number of pages is unknown
   * @default false
   */
  pagesUnknown?: boolean;

  /**
   * Override the page text.
   */
  pageText?: (page: number) => string;

  /**
   * Override the page range text.
   */
  pageRangeText?: (current: number, total: number) => string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  [key: `data-${string}`]: any;
};

export type PaginationProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Pagination extends SvelteComponentTyped<
  PaginationProps,
  {
    /** Dispatched after any user interaction. */
    change: CustomEvent<{ page?: number; pageSize?: number }>;
    /** Dispatched after any user interaction. */
    "click:button--previous": CustomEvent<{ page: number }>;
    /** Dispatched after any user interaction. */
    "click:button--next": CustomEvent<{ page: number }>;
    /** Dispatched after any user interaction. */
    update: CustomEvent<{ pageSize: number; page: number }>;
  },
  Record<string, never>
> {}
