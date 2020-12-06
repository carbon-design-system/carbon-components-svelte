/// <reference types="svelte" />

export interface SelectItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["option"]> {
  /**
   * Specify the option value
   * @default ""
   */
  value?: string;

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

export default class SelectItem {
  $$prop_def: SelectItemProps;
  $$slot_def: {};

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
