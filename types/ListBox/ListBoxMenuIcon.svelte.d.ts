/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export type ListBoxMenuIconTranslationId = "close" | "open";

export interface ListBoxMenuIconProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to open the list box menu icon
   * @default false
   */
  open?: boolean;

  /**
   * Override the default translation ids
   * @default (id) => defaultTranslations[id]
   */
  translateWithId?: (id: ListBoxMenuIconTranslationId) => string;
}

export default class ListBoxMenuIcon extends SvelteComponent<
  ListBoxMenuIconProps,
  { click: WindowEventMap["click"] },
  {}
> {
  /**
   * Default translation ids
   */
  translationIds: { close: "close"; open: "open" };
}
