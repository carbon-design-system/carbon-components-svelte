import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ListBoxMenuIconTranslationId = "close" | "open";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to open the list box menu icon
   * @default false
   */
  open?: boolean;

  /**
   * Override the default translation ids
   */
  translateWithId?: (id: ListBoxMenuIconTranslationId) => string;

  [key: `data-${string}`]: any;
};

export type ListBoxMenuIconProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ListBoxMenuIcon extends SvelteComponentTyped<
  ListBoxMenuIconProps,
  { click: WindowEventMap["click"] },
  Record<string, never>
> {
  /**
   * Default translation ids
   */
  translationIds: { close: "close"; open: "open" };
}
