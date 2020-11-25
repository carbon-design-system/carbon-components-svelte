/// <reference types="svelte" />
import { SvelteComponent } from "svelte";
import { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenuItem";

export interface ToolbarMenuItemProps extends OverflowMenuItemProps {}

export default class ToolbarMenuItem extends SvelteComponent<
  ToolbarMenuItemProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  { default: {} }
> {}
