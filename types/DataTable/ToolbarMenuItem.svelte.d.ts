import type { SvelteComponentTyped } from "svelte";
import type { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenuItem.svelte";

export type ToolbarMenuItemProps = OverflowMenuItemProps & {};

export default class ToolbarMenuItem extends SvelteComponentTyped<
  ToolbarMenuItemProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  { default: Record<string, never> }
> {}
