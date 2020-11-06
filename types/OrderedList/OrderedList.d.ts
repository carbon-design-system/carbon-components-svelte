/// <reference types="svelte" />

export interface OrderedListProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ol"]> {
  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;

  /**
   * Set to `true` to use native list styles
   * @default false
   */
  native?: boolean;
}

export default class OrderedList {
  $$prop_def: OrderedListProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
