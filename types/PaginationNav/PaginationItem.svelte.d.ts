import { SvelteComponentTyped } from "svelte";

export type PaginationItemProps = {
  /**
   * Specify the current page index
   * @default 1
   */
  page?: number;

  /**
   * Set to `true` to use the active state
   * @default false
   */
  active?: boolean;

  children?: (this: void) => void;
};

export default class PaginationItem extends SvelteComponentTyped<
  PaginationItemProps,
  { click: WindowEventMap["click"] },
  { default: Record<string, never> }
> {}
