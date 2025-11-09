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

export type SubtractProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Subtract extends SvelteComponentTyped<
  SubtractProps,
  Record<string, any>,
  Record<string, never>
> {}
