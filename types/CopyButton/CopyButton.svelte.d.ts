/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface CopyButtonProps
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
   * Set the title and ARIA label for the copy button
   * @default "Copy to clipboard"
   */
  iconDescription?: string;

  /**
   * Specify the text to copy
   * @default undefined
   */
  text: string;

  /**
   * Override the default copy behavior of using the navigator.clipboard.writeText API to copy text
   * @default async (text) => { try { await navigator.clipboard.writeText(text); } catch (e) { console.log(e); } }
   */
  copy?: (text: string) => void;
}

export default class CopyButton extends SvelteComponentTyped<
  CopyButtonProps,
  {
    click: WindowEventMap["click"];
    animationend: WindowEventMap["animationend"];
    copy: CustomEvent<null>;
  },
  {}
> {}
