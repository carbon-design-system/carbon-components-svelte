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

  /**
   * Specify the class of the `option` element
   * @default undefined
   */
  class?: string;

  /**
   * Specify the style of the `option` element
   * @default undefined
   */
  style?: string;
}

export default class SelectItem extends SvelteComponentTyped<
  SelectItemProps,
  Record<string, any>,
  {}
> {}
