import { SvelteComponentTyped } from "svelte";
import type { OverflowMenuProps } from "../OverflowMenu/OverflowMenu.svelte";

export type ToolbarMenuProps = OverflowMenuProps & {};

export default class ToolbarMenu extends SvelteComponentTyped<
  ToolbarMenuProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
