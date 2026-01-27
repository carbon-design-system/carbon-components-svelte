import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["a"];

type $Props = {
  /**
   * Set to `true` to select the current link
   * @default false
   */
  isSelected?: boolean;

  /**
   * Specify the `href` attribute.
   * @default undefined
   */
  href?: string;

  /**
   * Specify the text.
   * @default undefined
   */
  text?: string;

  /**
   * Specify the icon to render.
   * @default undefined
   */
  icon?: any;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type SideNavLinkProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SideNavLink extends SvelteComponentTyped<
  SideNavLinkProps,
  { click: WindowEventMap["click"] },
  { default: Record<string, never>; icon: Record<string, never> }
> {}
