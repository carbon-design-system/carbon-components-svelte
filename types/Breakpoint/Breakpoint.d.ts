/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export type BreakpointSize = "sm" | "md" | "lg" | "xlg" | "max";

export type BreakpointValue = 320 | 672 | 1056 | 1312 | 1584;

export interface BreakpointProps {
  size?: BreakpointSize;

  /**
   * @default { sm: false, md: false, lg: false, xlg: false, max: false, }
   */
  sizes?: Record<BreakpointSize, boolean>;

  /**
   * @constant
   * @default { sm: 320, md: 672, lg: 1056, xlg: 1312, max: 1584, }
   */
  breakpoints?: { sm: 320; md: 672; lg: 1056; xlg: 1312; max: 1584 };
}

export default class Breakpoint extends SvelteComponentTyped<
  BreakpointProps,
  {
    match: CustomEvent<{
      size: BreakpointSize;
      breakpointValue: BreakpointValue;
    }>;
  },
  { default: { sizes: Record<BreakpointSize, boolean>; size: BreakpointSize } }
> {}
