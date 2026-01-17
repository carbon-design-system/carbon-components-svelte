import { SvelteComponentTyped } from "svelte";

export type HeaderPanelDividerProps = {
  children?: (this: void) => void;
};

export default class HeaderPanelDivider extends SvelteComponentTyped<
  HeaderPanelDividerProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
