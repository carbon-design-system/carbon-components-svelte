/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface CopyProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set the feedback text shown after clicking the button
   * @default "Copied!"
   */
  feedback?: string;

  /**
   * Set the timeout duration (ms) to display feedback text
   * @default 2000
   */
  feedbackTimeout?: number;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class Copy extends SvelteComponentTyped<
  CopyProps,
  {
    click: WindowEventMap["click"];
    animationend: WindowEventMap["animationend"];
  },
  { default: {} }
> {}
