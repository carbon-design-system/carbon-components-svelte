import { SvelteComponentTyped } from "svelte";

export type ContextMenuGroupContext = {
  currentIds: import("svelte/store").Writable<ReadonlyArray<string>>;
  addOption: (data: { id: string }) => void;
  toggleOption: (data: { id: string }) => void;
};

export type ContextMenuGroupProps = {
  /**
   * @default []
   */
  selectedIds?: ReadonlyArray<string>;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  children?: (this: void) => void;
};

export default class ContextMenuGroup extends SvelteComponentTyped<
  ContextMenuGroupProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
