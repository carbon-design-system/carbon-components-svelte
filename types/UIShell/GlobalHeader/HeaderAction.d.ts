/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface HeaderActionProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to open the panel
   * @default false
   */
  isOpen?: boolean;

  /**
   * Specify the icon props
   */
  icon?: { render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean };

  /**
   * Specify the text
   * Alternatively, use the named slot "text" (e.g. <div slot="text">...</div>)
   */
  text?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class HeaderAction extends SvelteComponent<
  HeaderActionProps,
  { click: WindowEventMap["click"]; close: CustomEvent<any> },
  { default: {}; text: {} }
> {}
