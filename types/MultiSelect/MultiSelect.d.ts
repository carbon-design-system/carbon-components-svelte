/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type MultiSelectItemId = string;

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
  itemToString?: (item: MultiSelectItem) => string;

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
   * @default (item, value) => item.text.toLowerCase().includes(value.toLowerCase())
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
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the select
   */
  name?: string;
}

export default class MultiSelect extends SvelteComponentTyped<
  MultiSelectProps,
  {
    select: CustomEvent<{
      selectedIds: string[];
      selected: MultiSelectItem[];
      unselected: MultiSelectItem[];
    }>;
    clear: CustomEvent<any>;
    keydown: WindowEventMap["keydown"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  {}
> {}
