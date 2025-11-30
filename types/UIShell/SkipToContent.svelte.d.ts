import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["a"];

type $Props = {
  /**
   * Specify the `href` attribute
   * @default "#main-content"
   */
  href?: string;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  [key: `data-${string}`]: any;
};

export type SkipToContentProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SkipToContent extends SvelteComponentTyped<
  SkipToContentProps,
  { click: WindowEventMap["click"] },
  { default: Record<string, never> }
> {}
