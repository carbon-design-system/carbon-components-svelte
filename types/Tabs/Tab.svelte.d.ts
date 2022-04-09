/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TabProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  /**
   * Specify the tab label
   * Alternatively, use the default slot (e.g., <Tab><span>Label</span></Tab>)
   * @default ""
   */
  label?: string;

  /**
   * Specify the href attribute
   * @default "#"
   */
  href?: string;

  /**
   * Set to `true` to disable the tab
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the anchor HTML element
   * @default null
   */
  ref?: null | HTMLAnchorElement;
}

export default class Tab extends SvelteComponentTyped<
  TabProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
