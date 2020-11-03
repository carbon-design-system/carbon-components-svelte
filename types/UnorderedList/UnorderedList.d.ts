/// <reference types="svelte" />

export default class UnorderedList {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> & {
    /**
     * Set to `true` to use the nested variant
     * @default false
     */
    nested?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
