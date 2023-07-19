import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["nav"];

export interface HeaderNavProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class HeaderNav extends SvelteComponentTyped<
  HeaderNavProps,
  Record<string, any>,
  { default: {} }
> {}
