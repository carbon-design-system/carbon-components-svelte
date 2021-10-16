/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";
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

export default class Accordion extends SvelteComponentTyped<
  AccordionProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
