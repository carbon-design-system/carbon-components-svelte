/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type AutoCompleteItemId = any;

export type AutoCompleteItemText = string;

export interface AutoCompleteItem {
  id: AutoCompleteItemId;
  text: AutoCompleteItemText;
}

export interface AutoCompleteProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Override the display of a dropdown item
   * @default (item) => item.text || item.id
   */
  itemToString?: (item: AutoCompleteItem) => string;

  /**
   * Specify the selected item id
   * @default undefined
   */
  selectedId?: AutoCompleteItemId;

  /**
   * Specify the selected item
   * @default undefined
   */
  selectedItem?: AutoCompleteItem;

  /**
   * Determine if an item should be filtered given the current combobox value
   * @default () => []
   */
  shouldFilterItem?: (value: string) => AutoCompleteItem[];

  /**
   * Specify the direction of the dropdown menu
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Specify the size of the dropdown field
   * @default undefined
   */
  size?: "sm" | "lg" | "xl";

  /**
   * Set to `true` to open the dropdown
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the dropdown
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the title text
   * @default ""
   */
  titleText?: string;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Specify the invalid state text
   * @default ""
   */
  invalidText?: string;

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
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Override the default translation ids
   * @default undefined
   */
  translateWithId?: (id: any) => string;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the list box
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Specify the placeholder text
   * @default null
   */
  placeholder?: undefined;

  /**
   * Obtain a reference to the list HTML element
   * @default null
   */
  listRef?: null | HTMLDivElement;
}

export default class AutoComplete extends SvelteComponentTyped<
  AutoCompleteProps,
  {
    select: CustomEvent<{
      selectedId: AutoCompleteItemId;
      selectedItem: AutoCompleteItem;
    }>;
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    clear: WindowEventMap["clear"];
    scroll: WindowEventMap["scroll"];
  },
  { default: { item: AutoCompleteItem; index: number } }
> {
  /**
   * Clear the combo box programmatically
   */
  clear: (options?: { focus?: boolean }) => void;
}
