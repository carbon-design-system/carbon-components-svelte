import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ToolbarBatchActionsProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class ToolbarBatchActions extends SvelteComponentTyped<
  ToolbarBatchActionsProps,
  { cancel: CustomEvent<null> },
  { default: {}; cancel: {} }
> {}
