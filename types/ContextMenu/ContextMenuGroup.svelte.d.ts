import type { SvelteComponentTyped } from "svelte";

export interface ContextMenuGroupProps {
  /**
   * @default []
   */
  selectedIds?: ReadonlyArray<string>;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;
}

export default class ContextMenuGroup extends SvelteComponentTyped<
  ContextMenuGroupProps,
  Record<string, any>,
  { default: {} }
> {}
