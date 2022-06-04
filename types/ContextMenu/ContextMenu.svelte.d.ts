/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ContextMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Specify an element or list of elements to trigger the context menu.
   * If no element is specified, the context menu applies to the entire window
   * @default null
   */
  target?: null | ReadonlyArray<null | HTMLElement>;

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
    open: CustomEvent<HTMLElement>;
    click: WindowEventMap["click"];
    keydown: WindowEventMap["keydown"];
    close: CustomEvent<null>;
  },
  { default: {} }
> {}
