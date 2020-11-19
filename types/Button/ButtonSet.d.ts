/// <reference types="svelte" />

export interface ButtonSetProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to stack the buttons vertically
   * @default false
   */
  stacked?: boolean;
}

export default class ButtonSet {
  $$prop_def: ButtonSetProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
