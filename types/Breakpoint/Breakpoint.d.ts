/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type BreakpointSize = "sm" | "md" | "lg" | "xlg" | "max";

export type BreakpointValue = 320 | 672 | 1056 | 1312 | 1584;

export interface BreakpointProps {
  /**
   * Determine the current Carbon grid breakpoint size
   */
  size?: BreakpointSize;

  /**
   * Carbon grid sizes as an object
   * @default { sm: false, md: false, lg: false, xlg: false, max: false, }
   */
  sizes?: Record<BreakpointSize, boolean>;
}

export default class Breakpoint extends SvelteComponentTyped<
  BreakpointProps,
  {
    match: CustomEvent<{
      size: BreakpointSize;
      breakpointValue: BreakpointValue;
    }>;
  },
  { default: { size: BreakpointSize; sizes: Record<BreakpointSize, boolean> } }
> {
  /**
   * Reference the Carbon grid breakpoints
   * @constant
   * @default { sm: 320, md: 672, lg: 1056, xlg: 1312, max: 1584, }
   */
  breakpoints: Record<BreakpointSize, BreakpointValue>;
}
