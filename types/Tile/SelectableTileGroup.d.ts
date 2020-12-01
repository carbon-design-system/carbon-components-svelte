/// <reference types="svelte" />

export interface SelectableTileGroupProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["fieldset"]> {
  /**
   * Specify the selected tile's
   * @default []
   */
  selectedValues?: any[];

  /**
   * Specify the legend text
   * @default ""
   */
  legend?: string;
}

export default class SelectableTileGroup {
  $$prop_def: SelectableTileGroupProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "select", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
