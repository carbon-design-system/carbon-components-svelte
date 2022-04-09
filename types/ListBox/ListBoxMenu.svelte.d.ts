/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ListBoxMenuProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;
}

export default class ListBoxMenu extends SvelteComponentTyped<
  ListBoxMenuProps,
  { scroll: WindowEventMap["scroll"] },
  { default: {} }
> {}
