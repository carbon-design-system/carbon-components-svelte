/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface ClickableTileProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to click the tile
   * @default false
   */
  clicked?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set the `href`
   */
  href?: string;
}

export default class ClickableTile extends SvelteComponent<
  ClickableTileProps,
  {
    click: WindowEventMap["click"];
    keydown: WindowEventMap["keydown"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
