/// <reference types="svelte" />

export interface RadioButtonSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class RadioButtonSkeleton {
  $$prop_def: RadioButtonSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
