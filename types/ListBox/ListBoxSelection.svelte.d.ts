/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type ListBoxSelectionTranslationId = "clearAll" | "clearSelection";

export interface ListBoxSelectionProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of selected items
   * @default undefined
   */
  selectionCount?: number;

  /**
   * Set to `true` to disable the list box selection
   * @default false
   */
  disabled?: boolean;

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

export default class ListBoxSelection extends SvelteComponentTyped<
  ListBoxSelectionProps,
  { clear: CustomEvent<any> },
  {}
> {
  /**
   * Default translation ids
   */
  translationIds: { clearAll: "clearAll"; clearSelection: "clearSelection" };
}
