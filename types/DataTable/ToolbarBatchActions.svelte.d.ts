/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface ToolbarBatchActionsProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Override the total items selected text
   * @default (totalSelected) => `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`
   */
  formatTotalSelected?: (totalSelected: number) => string;
}

export default class ToolbarBatchActions extends SvelteComponentTyped<
  ToolbarBatchActionsProps,
  {},
  { default: {}; cancel: {} }
> {}
