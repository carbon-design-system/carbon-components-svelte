/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SelectItemProps {
  /**
   * Specify the option value
   * @default ""
   */
  value?: string | number;

  /**
   * Specify the option text
   * @default ""
   */
  text?: string;

  /**
   * Set to `true` to hide the option
   * @default false
   */
  hidden?: boolean;

  /**
   * Set to `true` to disable the option
   * @default false
   */
  disabled?: boolean;
}

export default class SelectItem extends SvelteComponentTyped<
  SelectItemProps,
  {},
  {}
> {}
