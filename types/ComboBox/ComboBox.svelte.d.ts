import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ComboBoxItemId = any;

export type ComboBoxItem = {
  id: ComboBoxItemId;
  text: string;
  /** Whether the item is disabled */ disabled?: boolean;
};

type $RestProps = SvelteHTMLElements["input"];

type $Props<Item> = {
  /**
   * Set the combobox items.
   * @default []
   */
  items?: ReadonlyArray<Item>;

  /**
   * Override the display of a combobox item.
   */
  itemToString?: (item: Item) => string;

  /**
   * Set the selected item by value id.
   * @default undefined
   */
  selectedId?: ComboBoxItemId;

  /**
   * Specify the selected combobox value
   * @default ""
   */
  value?: string;

  /**
   * Specify the direction of the combobox dropdown menu.
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Set the size of the combobox.
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
  labelText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

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
   * Set to `true` to allow custom values that are not in the items list.
   * By default, user-entered text is cleared when the combobox loses focus without selecting an item.
   * When enabled, custom text is preserved.
   * @default false
   */
  allowCustomValue?: boolean;

  /**
   * Set to `true` to clear the input value when opening the dropdown.
   * This allows users to see all available items instead of only filtered results.
   * The original value is restored if the dropdown is closed without making a selection.
   * @default false
   */
  clearFilterOnOpen?: boolean;

  /**
   * Set to `true` to enable autocomplete with typeahead
   * @default false
   */
  typeahead?: boolean;

  /**
   * Determine if an item should be filtered given the current combobox value.
   * Will be ignored if `typeahead` is enabled.
   */
  shouldFilterItem?: (item: Item, value: string) => boolean;

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
   * Defaults to "Clear selected item" since a combo box can only have one selection.
   * @default undefined
   */
  translateWithIdSelection?: (id: "clearSelection") => string;

  /**
   * Set an id for the list box component
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Specify a name attribute for the input.
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Obtain a reference to the list HTML element.
   * @default null
   */
  listRef?: null | HTMLDivElement;

  labelChildren?: (this: void) => void;

  children?: (this: void, ...args: [{ item: Item; index: number }]) => void;

  [key: `data-${string}`]: any;
};

export type ComboBoxProps<Item> = Omit<$RestProps, keyof $Props<Item>> &
  $Props<Item>;

export default class ComboBox<
  Item extends ComboBoxItem = ComboBoxItem,
> extends SvelteComponentTyped<
  ComboBoxProps<Item>,
  {
    select: CustomEvent<{ selectedId: ComboBoxItemId; selectedItem: Item }>;
    clear: CustomEvent<KeyboardEvent | MouseEvent>;
    input: WindowEventMap["input"];
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    paste: WindowEventMap["paste"];
    scroll: WindowEventMap["scroll"];
  },
  {
    default: { item: Item; index: number };
    labelChildren: Record<string, never>;
  }
> {
  /**
   * Clear the combo box programmatically.
   * By default, focuses the combo box after clearing. Set `options.focus` to `false` to prevent focusing.
   * @example
   * ```svelte
   * <ComboBox bind:this={comboBox} items={items} />
   * <button on:click={() => comboBox.clear()}>Clear</button>
   * <button on:click={() => comboBox.clear({ focus: false })}>Clear (No Focus)</button>
   * ```
   */
  clear: (options?: { focus?: boolean }) => Promise<void>;
}
