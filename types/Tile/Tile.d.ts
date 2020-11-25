/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TileProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;
}

export default class Tile extends SvelteComponent<
  TileProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
