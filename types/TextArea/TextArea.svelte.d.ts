/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TextAreaProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["textarea"]> {
  /**
   * Specify the textarea value
   * @default ""
   */
  value?: string;

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Specify the number of cols
   * @default 50
   */
  cols?: number;

  /**
   * Specify the number of rows
   * @default 4
   */
  rows?: number;

  /**
   * Specify the max character count
   * @default undefined
   */
  maxCount?: number;

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
   * Set to `true` to use the read-only variant
   * @default false
   */
  readonly?: boolean;

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
   * Set an id for the textarea element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the textarea HTML element
   * @default null
   */
  ref?: null | HTMLTextAreaElement;
}

export default class TextArea extends SvelteComponentTyped<
  TextAreaProps,
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
