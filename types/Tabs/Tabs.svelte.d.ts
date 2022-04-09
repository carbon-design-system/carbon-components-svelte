/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TabsProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the selected tab index
   * @default 0
   */
  selected?: number;

  /**
   * Specify the type of tabs
   * @default "default"
   */
  type?: "default" | "container";

  /**
   * Set to `true` for tabs to have an auto-width
   * @default false
   */
  autoWidth?: boolean;

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Show menu options"
   */
  iconDescription?: string;

  /**
   * Specify the tab trigger href attribute
   * @default "#"
   */
  triggerHref?: string;
}

export default class Tabs extends SvelteComponentTyped<
  TabsProps,
  {
    keypress: WindowEventMap["keypress"];
    click: WindowEventMap["click"];
    change: CustomEvent<any>;
  },
  { default: {}; content: {} }
> {}
