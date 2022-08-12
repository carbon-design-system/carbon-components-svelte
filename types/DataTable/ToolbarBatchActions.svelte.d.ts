/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ToolbarBatchActionsProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Override the total items selected text
   * @default (totalSelected) => `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`
   */
  formatTotalSelected?: (totalSelected: number) => string;

  /**
   * Set to `true` to show the toolbar regardless of row selection
   * @default false
   */
  active?: boolean;
}

export default class ToolbarBatchActions extends SvelteComponentTyped<
  ToolbarBatchActionsProps,
  { cancel: CustomEvent<null> },
  { default: {}; cancel: {} }
> {}
