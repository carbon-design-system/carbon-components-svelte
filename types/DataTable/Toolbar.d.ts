/// <reference types="svelte" />

export default class Toolbar {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["section"]> & {
    /**
     * Specify the toolbar size
     * @default "default"
     */
    size?: "sm" | "default";
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
