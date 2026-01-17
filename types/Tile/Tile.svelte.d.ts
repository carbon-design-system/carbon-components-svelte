import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type TileProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Tile extends SvelteComponentTyped<
  TileProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
