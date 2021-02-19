/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface TruncateProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * @default "end"
   */
  direction?: "end" | "front";
}

export default class Truncate extends SvelteComponentTyped<
  TruncateProps,
  {},
  { default: {} }
> {}
