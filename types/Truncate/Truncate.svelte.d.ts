import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["p"];

type $Props = {
  /**
   * @default "end"
   */
  clamp?: "end" | "front";

  [key: `data-${string}`]: any;
};

export type TruncateProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
