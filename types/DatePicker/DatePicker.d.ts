/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface DatePickerProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
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
   * Specify the date picker start date value (from)
   * Only works with the "range" date picker type
   * @default ""
   */
  valueFrom?: string;

  /**
   * Specify the date picker end date value (to)
   * Only works with the "range" date picker type
   * @default ""
   */
  valueTo?: string;

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

  /**
   * Set to true for correct using in Modal
   * @default false
   */
  staticProp?: boolean;
}

export default class DatePicker extends SvelteComponentTyped<
  DatePickerProps,
  {
    change: CustomEvent<
      | string
      | {
          selectedDates: [dateFrom: Date, dateTo?: Date];
          dateStr: string | { from: string; to: string };
        }
    >;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
