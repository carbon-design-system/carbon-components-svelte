/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ContentProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["main"]> {
  /**
   * Specify the id for the main element
   * @default "main-content"
   */
  id?: string;

  [key: `data-${string}`]: any;
}

export default class Content extends SvelteComponentTyped<
  ContentProps,
  {},
  { default: {} }
> {}
