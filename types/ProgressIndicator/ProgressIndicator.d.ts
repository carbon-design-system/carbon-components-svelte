/// <reference types="svelte" />

export interface ProgressIndicatorProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
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

export default class ProgressIndicator {
  $$prop_def: ProgressIndicatorProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "change", cb: (event: CustomEvent<number>) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
