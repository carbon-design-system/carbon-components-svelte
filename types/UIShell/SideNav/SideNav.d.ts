/// <reference types="svelte" />

export default class SideNav {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> & {
    /**
     * Set to `true` to use the fixed variant
     * @default false
     */
    fixed?: boolean;

    /**
     * Specify the ARIA label for the nav
     */
    ariaLabel?: string;

    /**
     * Set to `true` to toggle the expanded state
     * @default false
     */
    isOpen?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
