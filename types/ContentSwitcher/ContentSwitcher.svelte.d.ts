/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ContentSwitcherProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the selected index of the switch item
   * @default 0
   */
  selectedIndex?: number;

  /**
   * Specify the size of the content switcher
   * @default undefined
   */
  size?: "sm" | "xl";
}

export default class ContentSwitcher extends SvelteComponentTyped<
  ContentSwitcherProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
