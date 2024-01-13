import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["input"];

export interface TextInputProps extends RestProps {
  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to "char" to enable display the character counter or "word" to display the word count.
   * @default undefined
   */
  counter?: "char" | "word";

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

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
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

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
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to enable the light variant
   * For use on $ui-01 backgrounds only. Don't use this to make tile background color same as container background color
   * The light prop for `TextInput` has been deprecated in favor of the new `Layer` Layer component. It will be removed in the next major release
   * @deprecated
   * @default false
   */
  light?: boolean;

  /**
   * Specify the maximum number of characters/words allowed
   * This is needed in order for `counter` to display
   * @default undefined
   */
  maxCount?: number;

  /**
   * Specify a name attribute for the input
   * @default undefined
   */
  name?: string;

  /**
   * Specify the placeholder text
   * @default ""
   */
  placeholder?: string;

  /**
   * Set to `true` to use the read-only variant
   * @default false
   */
  readonly?: boolean;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Set to `true` to mark the field as required
   * @default false
   */
  required?: boolean;

  /**
   * Set the size of the input
   * @default undefined
   */
  size?: "sm" | "md" | "lg";

  /**
   * Specify the input value
   * `value` will be set to `null` if `type = "number"` and the value is empty
   * @default ""
   */
  value?: null | number | string;

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

  [key: `data-${string}`]: any;
}

export default class TextInput extends SvelteComponentTyped<
  TextInputProps,
  {
    change: CustomEvent<null | number | string>;
    input: CustomEvent<null | number | string>;
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
  { labelText: {} }
> {}
