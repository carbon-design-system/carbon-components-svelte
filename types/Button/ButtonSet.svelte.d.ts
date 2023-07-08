/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ButtonSetProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to stack the buttons vertically
   * @default false
   */
  stacked?: boolean;

  [key: `data-${string}`]: any;
}

export default class ButtonSet extends SvelteComponentTyped<
  ButtonSetProps,
  {},
  { default: {} }
> {}
