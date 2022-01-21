/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface TextInputProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Set the size of the input
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Specify the input value
   * @default ""
   */
  value?: number | string;

  /**
   * Specify the input type
   * @default ""
   */
  type?: string;

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default undefined
   */
  name?: string;

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
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Set to `true` to mark the field as required
   * @default false
   */
  required?: boolean;

  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  /**
   * Set to `true` to use the read-only variant
   * @default false
   */
  readonly?: boolean;
}

export default class TextInput extends SvelteComponentTyped<
  TextInputProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  { labelText: {} }
> {}
