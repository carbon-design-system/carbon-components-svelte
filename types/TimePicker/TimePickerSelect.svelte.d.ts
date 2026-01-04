import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type TimePickerSelectContext = {
  selectedValue: import("svelte/store").Writable<number | string>;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the select value.
   * @default ""
   */
  value?: number | string;

  /**
   * Set to `true` to disable the select
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Open list of options"
   */
  iconDescription?: string;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set an id for the select element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Specify a name attribute for the select element.
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the select HTML element
   * @default null
   */
  ref?: null | HTMLSelectElement;

  [key: `data-${string}`]: any;
};

export type TimePickerSelectProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TimePickerSelect extends SvelteComponentTyped<
  TimePickerSelectProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { labelChildren: Record<string, never>; default: Record<string, never> }
> {}
