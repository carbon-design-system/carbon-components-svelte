/// <reference types="svelte" />

export interface ComboBoxItem {
  id: string;
  text: string;
}

export interface ComboBoxProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the combobox items
   * @default []
   */
  items?: ComboBoxItem[];

  /**
   * Override the display of a combobox item
   * @default (item) => item.text || item.id
   */
  itemToString?: (item: ComboBoxItem) => string;

  /**
   * Set the selected item by value index
   * @default -1
   */
  selectedIndex?: number;

  /**
   * Specify the selected combobox value
   * @default ""
   */
  value?: string;

  /**
   * Set the size of the combobox
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
   * Override the default translation ids
   */
  translateWithId?: (id: any) => string;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
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

export default class ComboBox {
  $$prop_def: ComboBoxProps;
  $$slot_def: {};

  $on(
    eventname: "select",
    cb: (event: CustomEvent<{ selectedId: string; selectedIndex: number; selectedItem: ComboBoxItem }>) => void
  ): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: "clear", cb: (event: WindowEventMap["clear"]) => void): () => void;
  $on(eventname: "scroll", cb: (event: WindowEventMap["scroll"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
