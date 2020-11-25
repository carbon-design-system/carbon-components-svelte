/// <reference types="svelte" />
import { SvelteComponent } from "svelte";
import { OverflowMenuProps } from "../OverflowMenu/OverflowMenu";

export interface ToolbarMenuProps extends OverflowMenuProps {}

export default class ToolbarMenu extends SvelteComponent<ToolbarMenuProps, {}, { default: {} }> {}
