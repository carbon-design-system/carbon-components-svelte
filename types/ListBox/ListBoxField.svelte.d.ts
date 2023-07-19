import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ListBoxFieldTranslationId = "close" | "open";

type RestProps = SvelteHTMLElements["div"];

export interface ListBoxFieldProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class ListBoxField extends SvelteComponentTyped<
  ListBoxFieldProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { default: {} }
> {
  /**
   * Default translation ids
   */
  translationIds: { close: "close"; open: "open" };
}
