/// <reference types="svelte" />

export interface StructuredListProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the selected structured list row value
   */
  selected?: string;

  /**
   * Set to `true` to use the bordered variant
   * @default false
   */
  border?: boolean;

  /**
   * Set to `true` to use the selection variant
   * @default false
   */
  selection?: boolean;
}

export default class StructuredList {
  $$prop_def: StructuredListProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "change", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
