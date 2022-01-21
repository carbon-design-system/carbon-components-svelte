/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";
import { CopyProps } from "../Copy/Copy.svelte";

export interface CopyButtonProps extends CopyProps {
  /**
   * Set the title and ARIA label for the copy button
   * @default "Copy to clipboard"
   */
  iconDescription?: string;

  /**
   * Specify the text to copy
   * @default undefined
   */
  text?: string;

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
    copy: CustomEvent<any>;
  },
  {}
> {}
