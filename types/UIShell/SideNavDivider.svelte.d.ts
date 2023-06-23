/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface SideNavDividerProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {}

export default class SideNavDivider extends SvelteComponent<
  SideNavDividerProps,
  {},
  {}
> {}
