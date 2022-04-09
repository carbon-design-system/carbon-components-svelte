/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ToolbarProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["section"]> {
  /**
   * Specify the toolbar size
   * @default "default"
   */
  size?: "sm" | "default";
}

export default class Toolbar extends SvelteComponentTyped<
  ToolbarProps,
  {},
  { default: {} }
> {}
