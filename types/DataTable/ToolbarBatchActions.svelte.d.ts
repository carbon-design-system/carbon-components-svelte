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
   * Use a boolean to show or hide the toolbar
   * @default undefined
   */
  active?: undefined | boolean;
}

export default class ToolbarBatchActions extends SvelteComponentTyped<
  ToolbarBatchActionsProps,
  { cancel: CustomEvent<null> },
  { default: {}; cancel: {} }
> {}
