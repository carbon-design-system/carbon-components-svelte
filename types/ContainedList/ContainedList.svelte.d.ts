import type { SvelteComponentTyped } from "svelte";

export interface ContainedListProps {
  /**
   * @default "on-page"
   */
  kind?: "on-page" | "disclosed";

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Specify the size of the list
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Set to `true` for lines between list items to be inset.
   * @default false
   */
  inset?: boolean;

  /**
   * Set an id for the list
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class ContainedList extends SvelteComponentTyped<
  ContainedListProps,
  Record<string, any>,
  { default: {}; action: {}; labelText: {} }
> {}
