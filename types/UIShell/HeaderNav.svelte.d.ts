/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface HeaderNavProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {}

export default class HeaderNav extends SvelteComponentTyped<
  HeaderNavProps,
  {},
  { default: {} }
> {}
