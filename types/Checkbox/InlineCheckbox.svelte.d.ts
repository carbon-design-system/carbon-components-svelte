import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["input"];

type $Props = {
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
   * Specify the title attribute for the label element.
   * @default undefined
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

  [key: `data-${string}`]: any;
};

export type InlineCheckboxProps = Omit<$RestProps, keyof $Props> & $Props;

export default class InlineCheckbox extends SvelteComponentTyped<
  InlineCheckboxProps,
  {
    change: WindowEventMap["change"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  Record<string, never>
> {}
