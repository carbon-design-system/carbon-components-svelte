import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface TileProps extends RestProps {
  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  [key: `data-${string}`]: any;
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
