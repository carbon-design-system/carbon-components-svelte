/// <reference types="svelte" />

export default class ListBoxMenu {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set an id for the top-level element
     */
    id?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLDivElement;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "scroll", cb: (event: WindowEventMap["scroll"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
