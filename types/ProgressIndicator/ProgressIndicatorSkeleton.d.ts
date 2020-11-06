/// <reference types="svelte" />

export interface ProgressIndicatorSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Set to `true` to use the vertical variant
   * @default false
   */
  vertical?: boolean;

  /**
   * Specify the number of steps to render
   * @default 4
   */
  count?: number;
}

export default class ProgressIndicatorSkeleton {
  $$prop_def: ProgressIndicatorSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
