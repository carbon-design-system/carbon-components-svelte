/// <reference types="svelte" />

export interface HeaderSearchResult {
  href: string;
  text: string;
  description?: string;
}

export interface HeaderSearchProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Specify the search input value
   * @default ""
   */
  value?: string;

  /**
   * Set to `true` to activate and focus the search bar
   * @default false
   */
  active?: boolean;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Render a list of search results
   * @default []
   */
  results?: HeaderSearchResult[];

  /**
   * Specify the selected result index
   * @default 0
   */
  selectedResultIndex?: number;
}

export default class HeaderSearch {
  $$prop_def: HeaderSearchProps;
  $$slot_def: {
    default: { result: HeaderSearchResult; index: number };
  };

  $on(eventname: "active", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "inactive", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "clear", cb: (event: CustomEvent<any>) => void): () => void;
  $on(
    eventname: "select",
    cb: (event: CustomEvent<{ value: string; selectedResultIndex: number; selectedResult: HeaderSearchResult }>) => void
  ): () => void;
  $on(eventname: "change", cb: (event: WindowEventMap["change"]) => void): () => void;
  $on(eventname: "input", cb: (event: WindowEventMap["input"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
