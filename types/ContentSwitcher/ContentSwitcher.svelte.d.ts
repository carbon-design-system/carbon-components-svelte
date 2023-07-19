import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ContentSwitcherProps extends RestProps {
  /**
   * Set the selected index of the switch item
   * @default 0
   */
  selectedIndex?: number;

  /**
   * Specify the size of the content switcher
   * @default undefined
   */
  size?: "sm" | "xl";

  [key: `data-${string}`]: any;
}

export default class ContentSwitcher extends SvelteComponentTyped<
  ContentSwitcherProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
