/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface AccordionSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
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
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Set to `false` to close the first accordion item
   * @default true
   */
  open?: boolean;
}

export default class AccordionSkeleton extends SvelteComponentTyped<
  AccordionSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
