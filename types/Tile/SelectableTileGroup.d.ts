/// <reference types="svelte" />

export interface SelectableTileGroupProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["fieldset"]> {
  /**
   * Specify the selected tile's
   * @default []
   */
  selectedValues?: any[];

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

  /**
   * Set to `true` to enable the light variant throughout the group
   * @default false
   */
  light?: boolean;
}

export default class SelectableTileGroup {
  $$prop_def: SelectableTileGroupProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "select", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
