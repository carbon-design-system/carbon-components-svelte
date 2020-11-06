/// <reference types="svelte" />

export interface TileGroupProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["fieldset"]> {
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
}

export default class TileGroup {
  $$prop_def: TileGroupProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "select", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
