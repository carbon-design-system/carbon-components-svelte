/// <reference types="svelte" />

export interface ListBoxMenuProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;
}

export default class ListBoxMenu {
  $$prop_def: ListBoxMenuProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "scroll", cb: (event: WindowEventMap["scroll"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
