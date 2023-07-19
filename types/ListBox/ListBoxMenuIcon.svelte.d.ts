import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ListBoxMenuIconTranslationId = "close" | "open";

type RestProps = SvelteHTMLElements["div"];

export interface ListBoxMenuIconProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class ListBoxMenuIcon extends SvelteComponentTyped<
  ListBoxMenuIconProps,
  { click: WindowEventMap["click"] },
  {}
> {
  /**
   * Default translation ids
   */
  translationIds: { close: "close"; open: "open" };
}
