/// <reference types="svelte" />

export interface SelectItemGroupProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["optgroup"]> {
  /**
   * Set to `true` to disable the optgroup element
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the label attribute of the optgroup element
   * @default "Provide label"
   */
  label?: string;
}

export default class SelectItemGroup {
  $$prop_def: SelectItemGroupProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
