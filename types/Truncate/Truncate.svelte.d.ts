/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TruncateProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["p"]> {
  /**
   * @default "end"
   */
  clamp?: "end" | "front";

  [key: `data-${string}`]: any;
}

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  {},
  { default: {} }
> {}
