/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type MultiSelectItemId = any;

export type MultiSelectItemText = string;

export interface MultiSelectItem {
  id: MultiSelectItemId;
  text: MultiSelectItemText;
}

export interface MultiSelectProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Set the multiselect items
   * @default []
   */
  items?: MultiSelectItem[];

  /**
   * Override the display of a multiselect item
   * @default (item) => item.text || item.id
   */
  itemToString?: (item: MultiSelectItem) => any;

  /**
   * Set the selected ids
   * @default []
   */
  selectedIds?: MultiSelectItemId[];

  /**
   * Specify the multiselect value
   * @default ""
   */
  value?: string;

  /**
   * Set the size of the combobox
   * @default undefined
   */
  size?: "sm" | "lg" | "xl";

  /**
   * Specify the type of multiselect
   * @default "default"
   */
  type?: "default" | "inline";

  /**
   * Specify the direction of the multiselect dropdown menu
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Specify the selection feedback after selecting items
   * @default "top-after-reopen"
   */
  selectionFeedback?: "top" | "fixed" | "top-after-reopen";

  /**
   * Set to `true` to disable the dropdown
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to filter items
   * @default false
   */
  filterable?: boolean;

  /**
   * Override the filtering logic
   * The default filtering is an exact string comparison
   * @default (item, value) => item.text.toLowerCase().includes(value.trim().toLowerCase())
   */
  filterItem?: (item: MultiSelectItem, value: string) => string;

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
   * Specify the locale
   * @default "en"
   */
  locale?: string;

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Override the sorting logic
   * The default sorting compare the item text value
   * @default (a, b) => a.text.localeCompare(b.text, locale, { numeric: true })
   */
  sortItem?:
    | ((a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem)
    | (() => void);

  /**
   * Override the default translation ids
   * @default undefined
   */
  translateWithId?: (id: any) => string;

  /**
   * Specify the title text
   * @default ""
   */
  titleText?: string;

  /**
   * Set to `true` to pass the item to `itemToString` in the checkbox
   * @default false
   */
  useTitleInItem?: boolean;

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
   * Specify the list box label
   * @default ""
   */
  label?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the select
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  inputRef?: null | HTMLInputElement;

  /**
   * Obtain a reference to the outer div element
   * @default null
   */
  multiSelectRef?: null | HTMLDivElement;

  /**
   * Obtain a reference to the field box element
   * @default null
   */
  fieldRef?: null | HTMLDivElement;

  /**
   * Obtain a reference to the selection element
   * @default null
   */
  selectionRef?: null | HTMLDivElement;
}

export default class MultiSelect extends SvelteComponentTyped<
  MultiSelectProps,
  {
    select: CustomEvent<{
      selectedIds: MultiSelectItemId[];
      selected: MultiSelectItem[];
      unselected: MultiSelectItem[];
    }>;
    clear: CustomEvent<any>;
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  {}
> {}
