/// <reference types="svelte" />

export interface TableRowProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tr"]> {}

export default class TableRow {
  $$prop_def: TableRowProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
