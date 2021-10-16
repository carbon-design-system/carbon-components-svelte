/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";
import { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenuItem.svelte";

export interface ToolbarMenuItemProps extends OverflowMenuItemProps {}

export default class ToolbarMenuItem extends SvelteComponentTyped<
  ToolbarMenuItemProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  { default: {} }
> {}
