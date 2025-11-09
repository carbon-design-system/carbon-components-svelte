import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["svg"];

type $Props = {
  /**
   * @default 16
   */
  size?: number;

  /**
   * @default undefined
   */
  title?: undefined;

  [key: `data-${string}`]: any;
};

export type MenuProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Menu extends SvelteComponentTyped<
  MenuProps,
  Record<string, any>,
  Record<string, never>
> {}
