/// <reference types="svelte" />

export interface HeaderActionSearchProps {
  /**
   * Set to `true` to focus the search
   * @default false
   */
  searchIsActive?: boolean;
}

export default class HeaderActionSearch {
  $$prop_def: HeaderActionSearchProps;
  $$slot_def: {};

  $on(eventname: "inputSearch", cb: (event: CustomEvent<{ action: "search"; textInput: string }>) => void): () => void;
  $on(eventname: "focusInputSearch", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "focusOutInputSearch", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
