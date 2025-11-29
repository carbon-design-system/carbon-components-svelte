import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["svelte:element"];

type $Props = {
  /**
   * Specify the tag name.
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  [key: `data-${string}`]: any;
};

export type PortalProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Portal extends SvelteComponentTyped<
  PortalProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
