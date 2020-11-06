/// <reference types="svelte" />

export interface TextAreaSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class TextAreaSkeleton {
  $$prop_def: TextAreaSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
