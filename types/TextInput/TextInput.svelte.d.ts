import type { SvelteComponentTyped } from "svelte";

export interface TextInputProps {
  /**
   * Specify the input value
   * `value` will be set to `null` if `typeof value === "number"` and `value` is empty
   * @default ""
   */
  value?: null | number | string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Set the size of the input
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Set to `true` to enable the light variant
   * For use on $ui-01 backgrounds only. Don't use this to make tile background color same as container background color
   * The light prop for `TextInput` has been deprecated in favor of the new `Layer` Layer component. It will be removed in the next major release
   * @deprecated
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

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
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Set to `true` to enable display the character counter. Requires `maxCount` to be set.
   * @default false
   */
  counter?: boolean;

  /**
   * Specify the maximum number of characters/words allowed
   * This is needed in order for `counter` to display
   * @default undefined
   */
  maxCount?: number;

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
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  /**
   * Set to `true` to mark the field as required
   * @default false
   */
  required?: boolean;

  /**
   * Set to `true` to use the read-only variant
   * @default false
   */
  readonly?: boolean;

  /**
   * Set HTML attributes on the `label` element
   * @default {}
   */
  labelAttributes?: import("svelte/elements").HTMLLabelAttributes;

  /**
   * Set HTML attributes on the `input` element
   * @default {}
   */
  inputAttributes?: import("svelte/elements").HTMLInputAttributes;
}

export default class TextInput extends SvelteComponentTyped<
  TextInputProps,
  {
    click: WindowEventMap["click"];
    pointerup: WindowEventMap["pointerup"];
    pointerover: WindowEventMap["pointerover"];
    pointerenter: WindowEventMap["pointerenter"];
    pointerleave: WindowEventMap["pointerleave"];
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    paste: DocumentAndElementEventHandlersEventMap["paste"];
  },
  { helperText: {}; invalidText: {}; labelText: {}; warnText: {} }
> {}
