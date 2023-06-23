/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface ContentProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["main"]> {
  /**
   * Specify the id for the main element
   * @default "main-content"
   */
  id?: string;
}

export default class Content extends SvelteComponent<
  ContentProps,
  {},
  { default: {} }
> {}
