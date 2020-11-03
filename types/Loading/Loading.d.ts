/// <reference types="svelte" />

export default class Loading {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;

    /**
     * Set to `false` to disable the active state
     * @default true
     */
    active?: boolean;

    /**
     * Set to `false` to disable the overlay
     * @default true
     */
    withOverlay?: boolean;

    /**
     * Specify the label description
     * @default "Active loading indicator"
     */
    description?: string;

    /**
     * Set an id for the label element
     */
    id?: string;
  };

  $$slot_def: {};

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
