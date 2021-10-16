/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";
import { OverflowMenuProps } from "../OverflowMenu/OverflowMenu.svelte";

export interface ToolbarMenuProps extends OverflowMenuProps {}

export default class ToolbarMenu extends SvelteComponentTyped<
  ToolbarMenuProps,
  {},
  { default: {} }
> {}
