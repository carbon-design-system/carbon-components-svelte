/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface CheckboxProps {
  /**
   * Specify whether the checkbox is checked
   * @default false
   */
  checked?: boolean;

  /**
   * Specify whether the checkbox is indeterminate
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;

  /**
   * Set to `true` for the checkbox to be read-only
   * @default false
   */
  readonly?: boolean;

  /**
   * Set to `true` to disable the checkbox
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
   * Set a name for the input element
   * @default ""
   */
  name?: string;

  /**
   * Specify the title attribute for the label element
   */
  title?: string;

  /**
   * Set an id for the input label
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;
}

export default class Checkbox extends SvelteComponentTyped<
  CheckboxProps,
  {
    check: CustomEvent<boolean>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    change: WindowEventMap["change"];
  },
  {}
> {}
