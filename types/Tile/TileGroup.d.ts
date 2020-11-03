/// <reference types="svelte" />

export default class TileGroup {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["fieldset"]> & {
    /**
     * Specify the selected tile value
     */
    selected?: string;

    /**
     * Set to `true` to disable the tile group
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the legend text
     * @default ""
     */
    legend?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "select", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
