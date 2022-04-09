/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SwitchProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Specify the switch text
   * Alternatively, use the "text" slot  (e.g., <span slot="text">...</span>)
   * @default "Provide text"
   */
  text?: string;

  /**
   * Set to `true` for the switch to be selected
   * @default false
   */
  selected?: boolean;

  /**
   * Set to `true` to disable the switch
   * @default false
   */
  disabled?: boolean;

  /**
   * Set an id for the button element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class Switch extends SvelteComponentTyped<
  SwitchProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: {} }
> {}
