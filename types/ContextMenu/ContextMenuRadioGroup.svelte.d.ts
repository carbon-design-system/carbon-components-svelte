/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ContextMenuRadioGroupProps {
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
}

export default class ContextMenuRadioGroup extends SvelteComponentTyped<
  ContextMenuRadioGroupProps,
  {},
  { default: {} }
> {}
