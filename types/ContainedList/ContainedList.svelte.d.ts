import { SvelteComponentTyped } from "svelte";

export type ContainedListProps = {
  /**
   * Specify the kind of contained list.
   * @default "on-page"
   */
  kind?: "on-page" | "disclosed";

  /**
   * Specify the label text.
   * Alternatively, use the named slot "labelChildren".
   * @default ""
   */
  labelText?: string;

  /**
   * Specify the size of the list.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Set to `true` for lines between list items to be inset
   * @default false
   */
  inset?: boolean;

  /**
   * Set an id for the list element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;
};

export default class ContainedList extends SvelteComponentTyped<
  ContainedListProps,
  Record<string, any>,
  {
    action: Record<string, never>;
    labelChildren: Record<string, never>;
    default: Record<string, never>;
  }
> {}
