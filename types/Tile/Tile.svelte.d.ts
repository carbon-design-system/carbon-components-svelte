/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TileProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;
}

export default class Tile extends SvelteComponentTyped<
  TileProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
