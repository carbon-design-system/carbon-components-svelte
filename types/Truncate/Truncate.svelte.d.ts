import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["svelte:element"];

export interface TruncateProps extends RestProps {
  /**
   * Specify the truncation direction
   * @default "end"
   */
  clamp?: "end" | "front";

  /**
   * Specify the tag name
   * @default "p"
   */
  tag?: keyof HTMLElementTagNameMap;

  [key: `data-${string}`]: any;
}

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  Record<string, any>,
  { default: {} }
> {}
