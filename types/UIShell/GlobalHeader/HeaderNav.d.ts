/// <reference types="svelte" />

export default class HeaderNav {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> & {
    /**
     * Specify the ARIA label for the nav
     */
    ariaLabel?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
