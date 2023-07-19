import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["li"];

export interface SideNavDividerProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class SideNavDivider extends SvelteComponentTyped<
  SideNavDividerProps,
  Record<string, any>,
  {}
> {}
