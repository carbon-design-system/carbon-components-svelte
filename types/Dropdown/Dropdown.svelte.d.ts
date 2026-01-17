import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type DropdownItemId = any;

export type DropdownItemText = string;

export type DropdownItem = {
  id: DropdownItemId;
  text: DropdownItemText;
  /** Whether the item is disabled */ disabled?: boolean;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props<Item> = {
  /**
   * Set the dropdown items.
   * @default []
   */
  items?: ReadonlyArray<Item>;

  /**
   * Override the display of a dropdown item.
   */
  itemToString?: (item: Item) => string;

  /**
   * Specify the selected item id.
   * @default undefined
   */
  selectedId: DropdownItemId;

  /**
   * Specify the type of dropdown.
   * @default "default"
   */
  type?: "default" | "inline";

  /**
   * Specify the direction of the dropdown menu.
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Specify the size of the dropdown field.
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
  labelText?: string;

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
   * Specify the list box label.
   * @default undefined
   */
  label?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @default undefined
   */
  translateWithId?: (
    id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId,
  ) => string;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the list box.
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  children?: (this: void, ...args: [{ item: Item; index: number }]) => void;

  [key: `data-${string}`]: any;
};

export type DropdownProps<Item> = Omit<$RestProps, keyof $Props<Item>> &
  $Props<Item>;

export default class Dropdown<
  Item extends DropdownItem = DropdownItem,
> extends SvelteComponentTyped<
  DropdownProps<Item>,
  { select: CustomEvent<{ selectedId: DropdownItemId; selectedItem: Item }> },
  { default: { item: Item; index: number } }
> {}
