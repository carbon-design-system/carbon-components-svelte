import { SvelteComponentTyped } from "svelte";

export type HeaderPanelLinksProps = {
  children?: (this: void) => void;
};

export default class HeaderPanelLinks extends SvelteComponentTyped<
  HeaderPanelLinksProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
