/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface HeaderGlobalActionProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to use the active variant
   * @default false
   */
  isActive?: boolean;

  /**
   * Specify the icon to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class HeaderGlobalAction extends SvelteComponent<
  HeaderGlobalActionProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
