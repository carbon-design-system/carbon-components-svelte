/// <reference types="svelte" />

export interface SkeletonTextProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the number of lines to render
   * @default 3
   */
  lines?: number;

  /**
   * Set to `true` to use the heading size variant
   * @default false
   */
  heading?: boolean;

  /**
   * Set to `true` to use the paragraph size variant
   * @default false
   */
  paragraph?: boolean;

  /**
   * Specify the width of the text (% or px)
   * @default "100%"
   */
  width?: string;
}

export default class SkeletonText {
  $$prop_def: SkeletonTextProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
