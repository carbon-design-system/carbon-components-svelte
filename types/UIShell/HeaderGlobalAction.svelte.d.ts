/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface HeaderGlobalActionProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to use the active variant
   * @default false
   */
  isActive?: boolean;

  /**
   * Specify the icon to render
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class HeaderGlobalAction extends SvelteComponentTyped<
  HeaderGlobalActionProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
