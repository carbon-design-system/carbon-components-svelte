import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["optgroup"];

type $Props = {
  /**
   * Set to `true` to disable the optgroup element
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the label attribute of the optgroup element
   * @default "Provide label"
   */
  label?: string;

  [key: `data-${string}`]: any;
};

export type SelectItemGroupProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SelectItemGroup extends SvelteComponentTyped<
  SelectItemGroupProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
