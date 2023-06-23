/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";
import type { OverflowMenuProps } from "../OverflowMenu/OverflowMenu.svelte";

export interface ToolbarMenuProps extends OverflowMenuProps {}

export default class ToolbarMenu extends SvelteComponent<
  ToolbarMenuProps,
  {},
  { default: {} }
> {}
