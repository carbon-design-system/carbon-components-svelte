/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface HeaderNavProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {}

export default class HeaderNav extends SvelteComponent<
  HeaderNavProps,
  {},
  { default: {} }
> {}
