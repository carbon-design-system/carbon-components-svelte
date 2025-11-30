import { SvelteComponentTyped } from "svelte";
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

export type ViewProps = Omit<$RestProps, keyof $Props> & $Props;

export default class View extends SvelteComponentTyped<
  ViewProps,
  Record<string, any>,
  Record<string, never>
> {}
