import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface RadioButtonProps extends RestProps {
  /**
   * Specify the value of the radio button
   * @default ""
   */
  value?: string;

  /**
   * Set to `true` to check the radio button
   * @default false
   */
  checked?: boolean;

  /**
   * Set to `true` to disable the radio button
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to mark the field as required
   * @default false
   */
  required?: boolean;

  /**
   * Specify the label position
   * @default "right"
   */
  labelPosition?: "right" | "left";

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
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the radio button input
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  [key: `data-${string}`]: any;
}

export default class RadioButton extends SvelteComponentTyped<
  RadioButtonProps,
  { change: WindowEventMap["change"] },
  { labelText: {} }
> {}
