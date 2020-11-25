/// <reference types="svelte" />

export type ListBoxSelectionTranslationId = "clearAll" | "clearSelection";

export interface ListBoxSelectionProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of selected items
   */
  selectionCount?: any;

  /**
   * Set to `true` to disable the list box selection
   * @default false
   */
  disabled?: boolean;

  /**
   * Default translation ids
   * @constant
   * @default { clearAll: "clearAll", clearSelection: "clearSelection", }
   */
  translationIds?: { clearAll: "clearAll"; clearSelection: "clearSelection" };

  /**
   * Override the default translation ids
   * @default (id) => defaultTranslations[id]
   */
  translateWithId?: (id: ListBoxSelectionTranslationId) => string;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;
}

export default class ListBoxSelection {
  $$prop_def: ListBoxSelectionProps;
  $$slot_def: {};

  $on(eventname: "clear", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
