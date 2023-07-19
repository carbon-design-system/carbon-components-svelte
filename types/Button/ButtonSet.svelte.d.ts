import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ButtonSetProps extends RestProps {
  /**
   * Set to `true` to stack the buttons vertically
   * @default false
   */
  stacked?: boolean;

  [key: `data-${string}`]: any;
}

export default class ButtonSet extends SvelteComponentTyped<
  ButtonSetProps,
  Record<string, any>,
  { default: {} }
> {}
