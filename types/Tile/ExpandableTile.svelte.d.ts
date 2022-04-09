/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ExpandableTileProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to expand the tile
   * @default false
   */
  expanded?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Specify the max height of the tile  (number of pixels)
   * @default 0
   */
  tileMaxHeight?: number;

  /**
   * Specify the padding of the tile (number of pixels)
   * @default 0
   */
  tilePadding?: number;

  /**
   * Specify the icon text of the collapsed tile
   * @default "Interact to expand Tile"
   */
  tileCollapsedIconText?: string;

  /**
   * Specify the icon text of the expanded tile
   * @default "Interact to collapse Tile"
   */
  tileExpandedIconText?: string;

  /**
   * Specify the icon label of the expanded tile
   * @default ""
   */
  tileExpandedLabel?: string;

  /**
   * Specify the icon label of the collapsed tile
   * @default ""
   */
  tileCollapsedLabel?: string;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Set an id for the top-level div element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the top-level element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class ExpandableTile extends SvelteComponentTyped<
  ExpandableTileProps,
  {
    click: WindowEventMap["click"];
    keypress: WindowEventMap["keypress"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { above: {}; below: {} }
> {}
