/// <reference types="svelte" />

export default class TableContainer {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Specify the title of the data table
     * @default ""
     */
    title?: string;

    /**
     * Specify the description of the data table
     * @default ""
     */
    description?: string;

    /**
     * Set to `true` to enable a sticky header
     * @default false
     */
    stickyHeader?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
