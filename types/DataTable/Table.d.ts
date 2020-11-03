/// <reference types="svelte" />

export default class Table {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["table"]> & {
    /**
     * Set the size of the table
     */
    size?: "compact" | "short" | "tall";

    /**
     * Set to `true` to use zebra styles
     * @default false
     */
    zebra?: boolean;

    /**
     * Set to `true` to use static width
     * @default false
     */
    useStaticWidth?: boolean;

    /**
     * Set to `true` for the bordered variant
     * @default false
     */
    shouldShowBorder?: boolean;

    /**
     * Set to `true` for the sortable variant
     * @default false
     */
    sortable?: boolean;

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
