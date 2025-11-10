import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["a"];

type $Props = {
  /**
   * Set to `true` to use the active state
   * @default false
   */
  linkIsActive?: boolean;

  /**
   * Specify the `href` attribute
   * @default undefined
   */
  href?: string;

  /**
   * Specify the icon to render
   * @default undefined
   */
  icon?: any;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;

  [key: `data-${string}`]: any;
};

export type HeaderActionLinkProps = Omit<$RestProps, keyof $Props> & $Props;

export default class HeaderActionLink extends SvelteComponentTyped<
  HeaderActionLinkProps,
  { click: WindowEventMap["click"] },
  { icon: Record<string, never> }
> {}
