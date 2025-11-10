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

export type CheckmarkProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Checkmark extends SvelteComponentTyped<
  CheckmarkProps,
  Record<string, any>,
  Record<string, never>
> {}
