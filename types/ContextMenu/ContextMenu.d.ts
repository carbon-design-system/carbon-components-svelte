/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface ContextMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Set to `true` to open the menu
   * Either `x` and `y` must be greater than zero
   * @default false
   */
  open?: boolean;

  /**
   * Specify the horizontal offset of the menu position
   * @default 0
   */
  x?: number;

  /**
   * Specify the vertical offset of the menu position
   * @default 0
   */
  y?: number;

  /**
   * Obtain a reference to the unordered list HTML element
   * @default null
   */
  ref?: null | HTMLUListElement;
}

export default class ContextMenu extends SvelteComponentTyped<
  ContextMenuProps,
  {
    click: WindowEventMap["click"];
    keydown: WindowEventMap["keydown"];
    open: CustomEvent<any>;
    close: CustomEvent<any>;
  },
  { default: {} }
> {}
