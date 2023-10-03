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
   * Set to `true` to require the selection of a radio button
   * @default undefined
   */
  required?: boolean;

  /**
   * Specify a name attribute for the radio button inputs
   * @default undefined
   */
  name?: string;

  /**
   * Specify the legend text
   * @default ""
   */
  legend?: string;

  [key: `data-${string}`]: any;
}

export default class TileGroup extends SvelteComponentTyped<
  TileGroupProps,
  { select: CustomEvent<string> },
  { default: {} }
> {}
