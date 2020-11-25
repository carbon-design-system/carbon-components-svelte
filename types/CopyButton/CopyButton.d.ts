/// <reference types="svelte" />
import { SvelteComponent } from "svelte";
import { CopyProps } from "../Copy/Copy";

export interface CopyButtonProps extends CopyProps {
  /**
   * Set the title and ARIA label for the copy button
   * @default "Copy to clipboard"
   */
  iconDescription?: string;
}

export default class CopyButton extends SvelteComponent<
  CopyButtonProps,
  { click: WindowEventMap["click"]; animationend: WindowEventMap["animationend"] },
  {}
> {}
