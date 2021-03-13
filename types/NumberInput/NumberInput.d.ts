/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type NumberInputTranslationId = "increment" | "decrement";

export interface NumberInputProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Set the size of the input
   */
  size?: "sm" | "xl";

  /**
   * Specify the input value
   * @default ""
   */
  value?: number | string;

  /**
   * Specify the step increment
   * @default 1
   */
  step?: number;

  /**
   * Specify the maximum value
   */
  max?: number;

  /**
   * Specify the minimum value
   */
  min?: number;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` for the input to be read-only
   * @default false
   */
  readonly?: boolean;

  /**
   * Set to `true` to enable the mobile variant
   * @default false
   */
  mobile?: boolean;

  /**
   * Set to `true` to allow for an empty value
   * @default false
   */
  allowEmpty?: boolean;

  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the ARIA label for the increment icons
   * @default ""
   */
  iconDescription?: string;

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
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Specify the label text
   * @default ""
   */
  label?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Override the default translation ids
   * @default (id) => defaultTranslations[id]
   */
  translateWithId?: (id: NumberInputTranslationId) => string;

  /**
   * Default translation ids
   * @constant
   * @default { increment: "increment", decrement: "decrement", }
   */
  translationIds?: { increment: "increment"; decrement: "decrement" };

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

export default class NumberInput extends SvelteComponentTyped<
  NumberInputProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    input: WindowEventMap["input"];
  },
  { label: {} }
> {}
