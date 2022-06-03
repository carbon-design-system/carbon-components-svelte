/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface PasswordInputProps
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
   * Set to `"text"` to toggle the password visibility
   * @default "password"
   */
  type?: "text" | "password";

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Specify the hide password label text
   * @default "Hide password"
   */
  hidePasswordLabel?: string;

  /**
   * Specify the show password label text
   * @default "Show password"
   */
  showPasswordLabel?: string;

  /**
   * Set the alignment of the tooltip relative to the icon
   * @default "center"
   */
  tooltipAlignment?: "start" | "center" | "end";

  /**
   * Set the position of the tooltip relative to the icon
   * @default "bottom"
   */
  tooltipPosition?: "top" | "right" | "bottom" | "left";

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
   * Specify the text for the invalid state
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
   * Set to `true` to use inline version
   * @default false
   */
  inline?: boolean;

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
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;
}

export default class PasswordInput extends SvelteComponentTyped<
  PasswordInputProps,
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
    paste: DocumentAndElementEventHandlersEventMap["paste"];
  },
  { labelText: {} }
> {}
