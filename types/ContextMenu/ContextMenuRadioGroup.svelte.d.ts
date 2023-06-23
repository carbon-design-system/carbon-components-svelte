/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

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

export default class ContextMenuRadioGroup extends SvelteComponent<
  ContextMenuRadioGroupProps,
  {},
  { default: {} }
> {}
