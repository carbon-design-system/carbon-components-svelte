/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type ComboBoxItemId = any;

export interface ComboBoxItem {
  id: ComboBoxItemId;
  text: string;
  disabled?: boolean;
}

export interface ComboBoxProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Set the combobox items
   * @default []
   */
  items?: ReadonlyArray<ComboBoxItem>;

  /**
   * Override the display of a combobox item
   * @default (item) => item.text || item.id
   */
  itemToString?: (item: ComboBoxItem) => string;

  /**
   * Set the selected item by value id
   * @default undefined
   */
  selectedId?: ComboBoxItemId;

  /**
   * Specify the selected combobox value
   * @default ""
   */
  value?: string;

  /**
   * Specify the direction of the combobox dropdown menu
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Set the size of the combobox
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Set to `true` to disable the combobox
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the title text of the combobox
   * @default ""
   */
  titleText?: string;

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Specify the invalid state text
   * @default ""
   */
  invalidText?: string;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Set to `true` to indicate an warning state
   * @default false
   */
  warn?: boolean;

  /**
   * Specify the warning state text
   * @default ""
   */
  warnText?: string;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to open the combobox menu dropdown
   * @default false
   */
  open?: boolean;

  /**
   * Determine if an item should be filtered given the current combobox value
   * @default () => true
   */
  shouldFilterItem?: (item: ComboBoxItem, value: string) => boolean;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open
   * @default undefined
   */
  translateWithId?: (
    id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId
  ) => string;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" since a combo box can only have on selection.
   * @default undefined
   */
  translateWithIdSelection?: (id: "clearSelection") => string;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Obtain a reference to the list HTML element
   * @default null
   */
  listRef?: null | HTMLDivElement;
}

export default class ComboBox extends SvelteComponentTyped<
  ComboBoxProps,
  {
    select: CustomEvent<{
      selectedId: ComboBoxItemId;
      selectedItem: ComboBoxItem;
    }>;
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    paste: DocumentAndElementEventHandlersEventMap["paste"];
    clear: WindowEventMap["clear"];
    scroll: WindowEventMap["scroll"];
  },
  { default: { item: ComboBoxItem; index: number } }
> {
  /**
   * Clear the combo box programmatically
   */
  clear: (options?: { focus?: boolean }) => void;
}
