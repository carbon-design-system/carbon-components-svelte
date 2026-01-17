import { SvelteComponentTyped } from "svelte";

export type SideNavItemsProps = {
  children?: (this: void) => void;
};

export default class SideNavItems extends SvelteComponentTyped<
  SideNavItemsProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
