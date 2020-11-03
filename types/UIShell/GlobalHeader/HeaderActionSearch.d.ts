/// <reference types="svelte" />

export default class HeaderActionSearch {
  $$prop_def: {
    /**
     * Set to `true` to focus the search
     * @default false
     */
    searchIsActive?: boolean;
  };

  $$slot_def: {};

  $on(eventname: "focusInputSearch", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "focusOutInputSearch", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "inputSearch", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
