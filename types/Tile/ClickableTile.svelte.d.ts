import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["a"] & SvelteHTMLElements["p"];

export interface ClickableTileProps extends RestProps {
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
   * Set to `true` to disable the tile
   * @default false
   */
  disabled?: boolean;

  /**
   * Set the `href`
   * @default undefined
   */
  href?: string;

  [key: `data-${string}`]: any;
}

export default class ClickableTile extends SvelteComponentTyped<
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
