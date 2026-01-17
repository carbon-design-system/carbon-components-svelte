import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type MultiSelectItemId = any;

export type MultiSelectItemText = string;

export type MultiSelectItem = {
  id: MultiSelectItemId;
  text: MultiSelectItemText;
  /** Whether the item is disabled */ disabled?: boolean;
};
export type MultiSelectContext = {
  declareRef: (data: {
    key: "field" | "selection";
    ref: HTMLDivElement;
  }) => void;
};

type $RestProps = SvelteHTMLElements["input"];

type $Props<Item> = {
  /**
   * Set the multiselect items.
   * @default []
   */
  items?: ReadonlyArray<Item>;

  /**
   * Override the display of a multiselect item.
   */
  itemToString?: (item: Item) => any;

  /**
   * Override the item name, title, labelText, or value passed to the user-selectable checkbox input as well as the hidden inputs.
   */
  itemToInput?: (item: Item) => {
    name?: string;
    labelText?: any;
    title?: string;
    value?: string;
  };

  /**
   * Set the selected ids.
   * @default []
   */
  selectedIds?: ReadonlyArray<MultiSelectItemId>;

  /**
   * Specify the multiselect value
   * @default ""
   */
  value?: string;

  /**
   * Set the size of the combobox.
   * @default undefined
   */
  size?: "sm" | "lg" | "xl";

  /**
   * Specify the type of multiselect.
   * @default "default"
   */
  type?: "default" | "inline";

  /**
   * Specify the direction of the multiselect dropdown menu.
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Specify the selection feedback after selecting items.
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
   * Override the filtering logic.
   * The default filtering is an exact string comparison.
   */
  filterItem?: (item: Item, value: string) => boolean;

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
   * Override the sorting logic.
   * The default sorting compare the item text value.
   */
  sortItem?: ((a: Item, b: Item) => Item) | (() => void);

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @default undefined
   */
  translateWithId?: (
    id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId,
  ) => string;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" and "Clear all items" if more than one item is selected.
   * @default undefined
   */
  translateWithIdSelection?: (
    id: import("../ListBox/ListBoxSelection.svelte").ListBoxSelectionTranslationId,
  ) => string;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

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
   * Set to `true` to indicate a warning state
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
   * Specify a name attribute for the select.
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
   * Obtain a reference to the field box element.
   * @default null
   */
  fieldRef?: null | HTMLDivElement;

  /**
   * Obtain a reference to the selection element.
   * @default null
   */
  selectionRef?: null | HTMLDivElement;

  /**
   * Id of the highlighted ListBoxMenuItem.
   * @default null
   */
  highlightedId?: null | MultiSelectItemId;

  labelChildren?: (this: void) => void;

  children?: (this: void, ...args: [{ item: Item; index: number }]) => void;

  [key: `data-${string}`]: any;
};

export type MultiSelectProps<Item> = Omit<$RestProps, keyof $Props<Item>> &
  $Props<Item>;

export default class MultiSelect<
  Item extends MultiSelectItem = MultiSelectItem,
> extends SvelteComponentTyped<
  MultiSelectProps<Item>,
  {
    select: CustomEvent<{
      selectedIds: MultiSelectItemId[];
      selected: Item[];
      unselected: Item[];
    }>;
    clear: CustomEvent<null>;
    blur: FocusEvent | CustomEvent<FocusEvent>;
    keydown: WindowEventMap["keydown"];
    input: WindowEventMap["input"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    paste: WindowEventMap["paste"];
  },
  {
    default: { item: Item; index: number };
    labelChildren: Record<string, never>;
  }
> {}
