/// <reference types="svelte" />

export interface ButtonSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set the `href` to use an anchor link
   */
  href?: string;

  /**
   * Specify the size of button skeleton
   * @default "default"
   */
  size?: "default" | "field" | "small";

  /**
   * @default false
   */
  small?: boolean;
}

export default class ButtonSkeleton {
  $$prop_def: ButtonSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
