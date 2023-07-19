import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["fieldset"];

export interface TileGroupProps extends RestProps {
  /**
   * Specify the selected tile value
   * @default undefined
   */
  selected?: string;

  /**
   * Set to `true` to disable the tile group
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the legend text
   * @default ""
   */
  legend?: string;

  [key: `data-${string}`]: any;
}

export default class TileGroup extends SvelteComponentTyped<
  TileGroupProps,
  { select: CustomEvent<any> },
  { default: {} }
> {}
