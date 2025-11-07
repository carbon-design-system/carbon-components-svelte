import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["nav"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type HeaderNavProps = Omit<$RestProps, keyof $Props> & $Props;

export default class HeaderNav extends SvelteComponentTyped<
  HeaderNavProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
