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

export type InformationFilledProps = Omit<$RestProps, keyof $Props> & $Props;

export default class InformationFilled extends SvelteComponentTyped<
  InformationFilledProps,
  Record<string, any>,
  Record<string, never>
> {}
