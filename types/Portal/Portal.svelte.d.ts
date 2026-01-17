import { SvelteComponentTyped } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

type $RestProps = HTMLAttributes<HTMLElement>;

type $Props = {
  /**
   * Specify the tag name.
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type PortalProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Portal extends SvelteComponentTyped<
  PortalProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
