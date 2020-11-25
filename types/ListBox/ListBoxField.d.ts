/// <reference types="svelte" />

export type ListBoxFieldTranslationId = "close" | "open";

export interface ListBoxFieldProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to disable the list box field
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the role attribute
   * @default "combobox"
   */
  role?: string;

  /**
   * Specify the tabindex
   * @default "-1"
   */
  tabindex?: string;

  /**
   * Default translation ids
   * @constant
   * @default { close: "close", open: "open" }
   */
  translationIds?: { close: "close"; open: "open" };

  /**
   * Override the default translation ids
   * @default (id) => defaultTranslations[id]
   */
  translateWithId?: (id: ListBoxFieldTranslationId) => string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;
}

export default class ListBoxField {
  $$prop_def: ListBoxFieldProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
