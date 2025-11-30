import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["nav"];

type $Props = {
  /**
   * Specify the current page index
   * @default 1
   */
  page?: number;

  /**
   * Specify the total number of pages
   * @default 10
   */
  total?: number;

  /**
   * Specify the total number of pages to show
   * @default 10
   */
  shown?: number;

  /**
   * Set to `true` to loop the navigation
   * @default false
   */
  loop?: boolean;

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
   * Set the position of the tooltip relative to the pagination buttons.
   * @default "bottom"
   */
  tooltipPosition?: "top" | "right" | "bottom" | "left" | "outside" | "inside";

  [key: `data-${string}`]: any;
};

export type PaginationNavProps = Omit<$RestProps, keyof $Props> & $Props;

export default class PaginationNav extends SvelteComponentTyped<
  PaginationNavProps,
  {
    /** Fires after every user interaction */
    change: CustomEvent<{ page: number }>;
    "click:button--previous": CustomEvent<{ page: number }>;
    "click:button--next": CustomEvent<{ page: number }>;
  },
  Record<string, never>
> {}
