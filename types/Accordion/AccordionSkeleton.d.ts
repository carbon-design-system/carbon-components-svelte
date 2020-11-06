/// <reference types="svelte" />

export interface AccordionSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Specify the number of accordion items to render
   * @default 4
   */
  count?: number;

  /**
   * Specify alignment of accordion item chevron icon
   * @default "end"
   */
  align?: "start" | "end";

  /**
   * Specify the size of the accordion
   */
  size?: "sm" | "xl";

  /**
   * Set to `false` to close the first accordion item
   * @default true
   */
  open?: boolean;
}

export default class AccordionSkeleton {
  $$prop_def: AccordionSkeletonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
