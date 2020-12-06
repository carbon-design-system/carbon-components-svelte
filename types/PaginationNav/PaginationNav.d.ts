/// <reference types="svelte" />

export interface PaginationNavProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {
  /**
   * Specify the current page index
   * @default 0
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
}

export default class PaginationNav {
  $$prop_def: PaginationNavProps;
  $$slot_def: {};

  $on(eventname: "change", cb: (event: CustomEvent<{ page: number }>) => void): () => void;
  $on(eventname: "click:button--previous", cb: (event: CustomEvent<{ page: number }>) => void): () => void;
  $on(eventname: "click:button--next", cb: (event: CustomEvent<{ page: number }>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
