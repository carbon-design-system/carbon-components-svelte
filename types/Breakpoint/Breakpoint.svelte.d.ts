/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface BreakpointProps {
  /**
   * Determine the current Carbon grid breakpoint size
   * @default undefined
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
    change: CustomEvent<{
      size: BreakpointSize;
      breakpointValue: BreakpointValue;
    }>;
  },
  { default: { size: BreakpointSize; sizes: Record<BreakpointSize, boolean> } }
> {}
