/// <reference types="svelte" />
import { AccordionSkeletonProps } from "./AccordionSkeleton";

export interface AccordionProps extends AccordionSkeletonProps {
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
   * Set to `true` to disable the accordion
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;
}

export default class Accordion {
  $$prop_def: AccordionProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
