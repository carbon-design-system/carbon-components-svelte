import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to stack the buttons vertically
   * @default false
   */
  stacked?: boolean;

  [key: `data-${string}`]: any;
};

export type ButtonSetProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ButtonSet extends SvelteComponentTyped<
  ButtonSetProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
