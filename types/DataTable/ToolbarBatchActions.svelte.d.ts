import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Override the total items selected text
   */
  formatTotalSelected?: (totalSelected: number) => string;

  /**
   * Use a boolean to show or hide the toolbar
   * @default undefined
   */
  active?: undefined | boolean;

  /**
   * Specify the selected IDs for standalone usage.
   * This is unnecessary if using this component with `DataTable`.
   * @default []
   */
  selectedIds?: ReadonlyArray<any>;

  [key: `data-${string}`]: any;
};

export type ToolbarBatchActionsProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ToolbarBatchActions extends SvelteComponentTyped<
  ToolbarBatchActionsProps,
  { cancel: CustomEvent<null> },
  { default: Record<string, never>; cancel: Record<string, never> }
> {}
