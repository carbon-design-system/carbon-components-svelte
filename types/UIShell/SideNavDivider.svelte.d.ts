/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface SideNavDividerProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {}

export default class SideNavDivider extends SvelteComponentTyped<
  SideNavDividerProps,
  {},
  {}
> {}
