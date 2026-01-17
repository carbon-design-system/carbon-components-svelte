import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type SelectValue = string | number;
export type SelectContext = {
  selectedValue: import("svelte/store").Writable<string | number | undefined>;
  /** Use the first `SelectItem` value as the
default value if `selected` is `undefined`. */
  setDefaultValue: (id: string, value: string | number) => void;
};

type $RestProps = SvelteHTMLElements["select"];

type $Props<Value> = {
  /**
   * Specify the selected item value.
   * @default undefined
   */
  selected?: Value | undefined;

  /**
   * Set the size of the select input.
   * @default undefined
   */
  size?: "sm" | "xl";

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
   * Set to `true` to disable the select element
   * @default false
   */
  disabled?: boolean;

  /**
   * Set an id for the select element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the select element.
   * @default undefined
   */
  name?: string;

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
   * Set to `true` to not render a label
   * @default false
   */
  noLabel?: boolean;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Obtain a reference to the select HTML element
   * @default null
   */
  ref?: null | HTMLSelectElement;

  /**
   * Set to `true` to mark the field as required
   * @default false
   */
  required?: boolean;

  labelChildren?: (this: void) => void;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type SelectProps<Value> = Omit<$RestProps, keyof $Props<Value>> &
  $Props<Value>;

export default class Select<
  Value extends string | number = string | number,
> extends SvelteComponentTyped<
  SelectProps<Value>,
  {
    /** The selected value. */
    update: CustomEvent<Value>;
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { labelChildren: Record<string, never>; default: Record<string, never> }
> {}
