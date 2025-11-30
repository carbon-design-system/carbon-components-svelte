import { SvelteComponentTyped } from "svelte";

export type PaginationOverflowProps = {
  /**
   * Specify the pivot start index
   * @default 0
   */
  fromIndex?: number;

  /**
   * Specify the pivot end index
   * @default 0
   */
  count?: number;
};

export default class PaginationOverflow extends SvelteComponentTyped<
  PaginationOverflowProps,
  { select: CustomEvent<{ index: number }> },
  Record<string, never>
> {}
