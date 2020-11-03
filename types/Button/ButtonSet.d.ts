/// <reference types="svelte" />

export default class ButtonSet {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set to `true` to stack the buttons vertically
     * @default false
     */
    stacked?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
