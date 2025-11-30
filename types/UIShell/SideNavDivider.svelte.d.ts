import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type SideNavDividerProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SideNavDivider extends SvelteComponentTyped<
  SideNavDividerProps,
  Record<string, any>,
  Record<string, never>
> {}
