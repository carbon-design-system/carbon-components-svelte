/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface SideNavProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {
  /**
   * Set to `true` to use the fixed variant
   * @default false
   */
  fixed?: boolean;

  /**
   * Set to `true` to use the rail variant
   * @default false
   */
  rail?: boolean;

  /**
   * Specify the ARIA label for the nav
   */
  ariaLabel?: string;

  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  isOpen?: boolean;
}

export default class SideNav extends SvelteComponentTyped<
  SideNavProps,
  {
    open: CustomEvent<any>;
    close: CustomEvent<any>;
    ["click:overlay"]: CustomEvent<any>;
  },
  { default: {} }
> {}
