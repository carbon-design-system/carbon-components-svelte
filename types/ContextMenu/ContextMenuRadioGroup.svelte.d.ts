import { SvelteComponentTyped } from "svelte";

export type ContextMenuRadioGroupContext = {
  currentId: import("svelte/store").Writable<string>;
  radioIds: import("svelte/store").Writable<ReadonlyArray<string>>;
  addOption: (data: { id: string }) => void;
  setOption: (data: { id: string }) => void;
};

export type ContextMenuRadioGroupProps = {
  /**
   * Set the selected radio group id
   * @default ""
   */
  selectedId?: string;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  children?: (this: void) => void;
};

export default class ContextMenuRadioGroup extends SvelteComponentTyped<
  ContextMenuRadioGroupProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
