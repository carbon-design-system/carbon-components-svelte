/// <reference types="svelte" />

export interface DatePickerProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the date picker type
   * @default "simple"
   */
  datePickerType?: "simple" | "single" | "range";

  /**
   * Specify the date picker input value
   * @default ""
   */
  value?: number | string;

  /**
   * Specify the element to append the calendar to
   */
  appendTo?: HTMLElement;

  /**
   * Specify the date format
   * @default "m/d/Y"
   */
  dateFormat?: string;

  /**
   * Specify the maximum date
   * @default null
   */
  maxDate?: null | string | Date;

  /**
   * Specify the minimum date
   * @default null
   */
  minDate?: null | string | Date;

  /**
   * Specify the locale
   * @default "en"
   */
  locale?: string;

  /**
   * Set to `true` to use the short variant
   * @default false
   */
  short?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set an id for the date picker element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class DatePicker {
  $$prop_def: DatePickerProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "change", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
