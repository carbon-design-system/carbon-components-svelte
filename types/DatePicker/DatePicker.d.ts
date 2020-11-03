/// <reference types="svelte" />

export default class DatePicker {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Specify the date picker type
     * @default "simple"
     */
    datePickerType?: "simple" | "single" | "range";

    /**
     * Specify the date picker input value
     * @default ""
     */
    value?: string;

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
     */
    id?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "change", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "undefined", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
