/// <reference types="svelte" />

export interface StructuredListRowProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["label"]> {
  /**
   * Set to `true` to use as a header
   * @default false
   */
  head?: boolean;

  /**
   * Set to `true` to render a label slot
   * @default false
   */
  label?: boolean;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;
}

export default class StructuredListRow {
  $$prop_def: StructuredListRowProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
