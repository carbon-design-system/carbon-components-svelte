/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TileGroupProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["fieldset"]> {
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
}

export default class TileGroup extends SvelteComponentTyped<
  TileGroupProps,
  { select: CustomEvent<any> },
  { default: {} }
> {}
