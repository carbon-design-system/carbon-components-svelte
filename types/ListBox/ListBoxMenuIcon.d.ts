/// <reference types="svelte" />

export type ListBoxMenuIconTranslationId = "close" | "open";

export interface ListBoxMenuIconProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to open the list box menu icon
   * @default false
   */
  open?: boolean;

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
  translateWithId?: (id: ListBoxMenuIconTranslationId) => string;
}

export default class ListBoxMenuIcon {
  $$prop_def: ListBoxMenuIconProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
