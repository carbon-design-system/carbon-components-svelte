/// <reference types="svelte" />

export interface DatePickerSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to use the range variant
   * @default false
   */
  range?: boolean;

  /**
   * Set an id to be used by the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class DatePickerSkeleton {
  $$prop_def: DatePickerSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
