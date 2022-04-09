/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TruncateProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["p"]> {
  /**
   * @default "end"
   */
  clamp?: "end" | "front";
}

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  {},
  { default: {} }
> {}
