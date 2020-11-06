/// <reference types="svelte" />

export interface ExpandableTileProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
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
  ref?: null | HTMLDivElement;
}

export default class ExpandableTile {
  $$prop_def: ExpandableTileProps;
  $$slot_def: {
    above: {};
    below: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "keypress", cb: (event: WindowEventMap["keypress"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
