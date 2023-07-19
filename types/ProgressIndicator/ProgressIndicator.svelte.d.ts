import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["ul"];

export interface ProgressIndicatorProps extends RestProps {
  /**
   * Specify the current step index
   * @default 0
   */
  currentIndex?: number;

  /**
   * Set to `true` to use the vertical variant
   * @default false
   */
  vertical?: boolean;

  /**
   * Set to `true` to specify whether the progress steps should be split equally in size in the div
   * @default false
   */
  spaceEqually?: boolean;

  /**
   * Set to `true` to prevent `currentIndex` from updating
   * @default false
   */
  preventChangeOnClick?: boolean;

  [key: `data-${string}`]: any;
}

export default class ProgressIndicator extends SvelteComponentTyped<
  ProgressIndicatorProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
