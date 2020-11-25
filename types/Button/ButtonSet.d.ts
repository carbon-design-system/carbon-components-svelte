/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface ButtonSetProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to stack the buttons vertically
   * @default false
   */
  stacked?: boolean;
}

export default class ButtonSet extends SvelteComponent<ButtonSetProps, {}, { default: {} }> {}
