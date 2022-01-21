/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type DropdownItemId = any;

export type DropdownItemText = string;

export interface DropdownItem {
  id: DropdownItemId;
  text: DropdownItemText;
}

export interface DropdownProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the dropdown items
   * @default []
   */
  items?: DropdownItem[];

  /**
   * Override the display of a dropdown item
   * @default (item) => item.text || item.id
   */
  itemToString?: (item: DropdownItem) => string;

  /**
   * Specify the selected item id
   * @default undefined
   */
  selectedId?: DropdownItemId;

  /**
   * Specify the type of dropdown
   * @default "default"
   */
  type?: "default" | "inline";

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
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

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
   * Specify the list box label
   * @default undefined
   */
  label?: string;

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
  ref?: null | HTMLButtonElement;
}

export default class Dropdown extends SvelteComponentTyped<
  DropdownProps,
  {
    select: CustomEvent<{
      selectedId: DropdownItemId;
      selectedItem: DropdownItem;
    }>;
  },
  {}
> {}
