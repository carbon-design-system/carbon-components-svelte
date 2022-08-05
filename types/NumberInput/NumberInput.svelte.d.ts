/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type NumberInputTranslationId = "increment" | "decrement";

export interface NumberInputProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Set the size of the input
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Specify the input value.
   * Use `null` to denote "no value"
   * @default null
   */
  value?: null | number;

  /**
   * Specify the step increment
   * @default 1
   */
  step?: number;

  /**
   * Specify the maximum value
   * @default undefined
   */
  max?: number;

  /**
   * Specify the minimum value
   * @default undefined
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
   * Set to `true` to hide the input stepper buttons
   * @default false
   */
  hideSteppers?: boolean;

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
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default undefined
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
    change: CustomEvent<null | number>;
    input: CustomEvent<null | number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    paste: DocumentAndElementEventHandlersEventMap["paste"];
  },
  { label: {} }
> {
  /**
   * Default translation ids
   */
  translationIds: { increment: "increment"; decrement: "decrement" };
}
