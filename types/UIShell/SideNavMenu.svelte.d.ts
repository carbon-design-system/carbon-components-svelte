import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["button"];

type $Props = {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

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
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  [key: `data-${string}`]: any;
};

export type SideNavMenuProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SideNavMenu extends SvelteComponentTyped<
  SideNavMenuProps,
  { click: WindowEventMap["click"] },
  { icon: Record<string, never>; default: Record<string, never> }
> {}
