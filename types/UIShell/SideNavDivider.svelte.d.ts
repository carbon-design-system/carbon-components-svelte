/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SideNavDividerProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  [key: `data-${string}`]: any;
}

export default class SideNavDivider extends SvelteComponentTyped<
  SideNavDividerProps,
  {},
  {}
> {}
