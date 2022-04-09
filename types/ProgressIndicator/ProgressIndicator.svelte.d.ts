/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ProgressIndicatorProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
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
