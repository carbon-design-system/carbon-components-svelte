/// <reference types="svelte" />

export interface HeaderNavProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {
  /**
   * Specify the ARIA label for the nav
   */
  ariaLabel?: string;
}

export default class HeaderNav {
  $$prop_def: HeaderNavProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
