import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface HelperTextProps extends RestProps {
  /**
   * Specify the helper text as parameter
   * @default ""
   */
  helperText?: string;

  /**
   * Set to `true` for the disabled variant
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to use inline variant
   * @default false
   */
  inline?: boolean;

  [key: `data-${string}`]: any;
}

export default class HelperText extends SvelteComponentTyped<
  HelperTextProps,
  Record<string, any>,
  { default: {} }
> {}
