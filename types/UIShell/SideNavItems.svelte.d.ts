import { SvelteComponentTyped } from "svelte";

export type SideNavItemsProps = Record<string, never>;

export default class SideNavItems extends SvelteComponentTyped<
  SideNavItemsProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
