/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface TruncateProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["p"]> {
  /**
   * @default "end"
   */
  clamp?: "end" | "front";
}

export default class Truncate extends SvelteComponent<
  TruncateProps,
  {},
  { default: {} }
> {}
