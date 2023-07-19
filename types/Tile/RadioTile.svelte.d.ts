import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["label"];

export interface RadioTileProps extends RestProps {
  /**
   * Set to `true` to check the tile
   * @default false
   */
  checked?: boolean;

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
   * Specify the value of the radio input
   * @default ""
   */
  value?: string;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Specify the ARIA label for the radio tile checkmark icon
   * @default "Tile checkmark"
   */
  iconDescription?: string;

  /**
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default ""
   */
  name?: string;

  [key: `data-${string}`]: any;
}

export default class RadioTile extends SvelteComponentTyped<
  RadioTileProps,
  {
    change: WindowEventMap["change"];
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
