import type { SvelteComponentTyped } from "svelte";
import type { ButtonProps } from "../Button/Button.svelte";

export interface HeaderGlobalActionProps extends ButtonProps {
  /**
   * Set to `true` to use the active variant
   * @default false
   */
  isActive?: boolean;

  /**
   * Specify the icon to render
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent<any>;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: HTMLButtonElement;
}

export default class HeaderGlobalAction extends SvelteComponentTyped<
  HeaderGlobalActionProps,
  { click: WindowEventMap["click"] },
  {}
> {}
