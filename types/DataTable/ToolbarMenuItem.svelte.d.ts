/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";
import type { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenuItem.svelte";

export interface ToolbarMenuItemProps extends OverflowMenuItemProps {}

export default class ToolbarMenuItem extends SvelteComponent<
  ToolbarMenuItemProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  { default: {} }
> {}
