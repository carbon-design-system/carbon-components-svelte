/// <reference types="svelte" />

export interface TimePickerProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the size of the input
   */
  size?: "sm" | "xl";

  /**
   * Specify the input value
   * @default ""
   */
  value?: string;

  /**
   * Specify the input type
   * @default "text"
   */
  type?: string;

  /**
   * Specify the input placeholder text
   * @default "hh=mm"
   */
  placeholder?: string;

  /**
   * Specify the `pattern` attribute for the input element
   * @default "(1[012]|[1-9]):[0-5][0-9](\\s)?"
   */
  pattern?: string;

  /**
   * Specify the `maxlength` input attribute
   * @default 5
   */
  maxlength?: number;

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
   * Set an id for the input element
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
}

export default class TimePicker {
  $$prop_def: TimePickerProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "change", cb: (event: WindowEventMap["change"]) => void): () => void;
  $on(eventname: "input", cb: (event: WindowEventMap["input"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
