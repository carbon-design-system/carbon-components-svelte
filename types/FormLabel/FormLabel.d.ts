/// <reference types="svelte" />

export interface FormLabelProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["label"]> {
  /**
   * Set an id to be used by the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class FormLabel {
  $$prop_def: FormLabelProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
