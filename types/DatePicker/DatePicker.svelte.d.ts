import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type DatePickerContext = {
  range: import("svelte/store").Readable<boolean>;
  inputValue: import("svelte/store").Writable<number | string>;
  inputValueFrom: import("svelte/store").Writable<string>;
  inputValueTo: import("svelte/store").Writable<string>;
  inputIds: import("svelte/store").Readable<ReadonlyArray<string>>;
  hasCalendar: import("svelte/store").Readable<boolean>;
  add: (data: { id: string; labelText: string }) => void;
  declareRef: (data: { id: string; ref: HTMLInputElement }) => void;
  updateValue: (data: { type: "input" | "change"; value: string }) => void;
  blurInput: (relatedTarget: EventTarget | null) => void;
  openCalendar: () => void;
  focusCalendar: () => void;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the date picker type.
   * @default "simple"
   */
  datePickerType?: "simple" | "single" | "range";

  /**
   * Specify the date picker input value.
   * @default ""
   */
  value?: number | string;

  /**
   * Specify the date picker start date value (from).
   * Only works with the "range" date picker type.
   * @default ""
   */
  valueFrom?: string;

  /**
   * Specify the date picker end date value (to).
   * Only works with the "range" date picker type.
   * @default ""
   */
  valueTo?: string;

  /**
   * Specify the date format
   * @default "m/d/Y"
   */
  dateFormat?: string;

  /**
   * Specify the maximum date.
   * @default null
   */
  maxDate?: null | string | Date;

  /**
   * Specify the minimum date.
   * @default null
   */
  minDate?: null | string | Date;

  /**
   * Specify the locale.
   * @default "en"
   */
  locale?:
    | import("flatpickr/dist/types/locale").CustomLocale
    | import("flatpickr/dist/types/locale").key;

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
   * Override the options passed to the Flatpickr instance.
   * @see https://flatpickr.js.org/options
   * @default { static: true }
   */
  flatpickrProps?: import("flatpickr/dist/types/options").Options;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type DatePickerProps = Omit<$RestProps, keyof $Props> & $Props;

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
  { default: Record<string, never> }
> {}
