import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["p"];

export interface TruncateProps extends RestProps {
  /**
   * @default "end"
   */
  clamp?: "end" | "front";

  [key: `data-${string}`]: any;
}

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  Record<string, any>,
  { default: {} }
> {}
