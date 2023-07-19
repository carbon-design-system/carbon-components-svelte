import type { SvelteComponentTyped } from "svelte";
import type { OverflowMenuProps } from "../OverflowMenu/OverflowMenu.svelte";

export interface ToolbarMenuProps extends OverflowMenuProps {}

export default class ToolbarMenu extends SvelteComponentTyped<
  ToolbarMenuProps,
  Record<string, any>,
  { default: {} }
> {}
