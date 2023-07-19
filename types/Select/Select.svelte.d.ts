import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface SelectProps extends RestProps {
  /**
   * Specify the selected item value
   * @default undefined
   */
  selected?: string | number;

  /**
   * Set the size of the select input
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
   * Specify a name attribute for the select element
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

  [key: `data-${string}`]: any;
}

export default class Select extends SvelteComponentTyped<
  SelectProps,
  {
    /** The selected value. */ update: CustomEvent<string | number>;
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { default: {}; labelText: {} }
> {}
