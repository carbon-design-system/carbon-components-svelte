<script>
  // @ts-check

  /**
   * @typedef {"sm" | "md" | "lg" | "xlg" | "max"} BreakpointSize
   * @typedef {320 | 672 | 1056 | 1312 | 1584} BreakpointValue
   * @event {{ size: BreakpointSize; breakpointValue: BreakpointValue; }} change
   * @slot {{ size: BreakpointSize; sizes: Record<BreakpointSize, boolean>; }}
   */

  /**
   * Determine the current Carbon grid breakpoint size
   * @type {BreakpointSize}
   */
  export let size = undefined;

  /**
   * Bind to all Carbon grid breakpoints.
   * @type {Record<BreakpointSize, boolean>}
   */
  export let sizes = {
    sm: false,
    md: false,
    lg: false,
    xlg: false,
    max: false,
  };

  import { createEventDispatcher } from "svelte";
  import { breakpointObserver } from "./breakpointObserver";
  import { breakpoints } from "./breakpoints";

  /** @type {import("svelte").EventDispatcher<{ change: { size: BreakpointSize; breakpointValue: BreakpointValue; } }>} */
  const dispatch = createEventDispatcher();
  const observer = breakpointObserver();

  $: size = $observer;
  $: sizes = {
    sm: size == "sm",
    md: size == "md",
    lg: size == "lg",
    xlg: size == "xlg",
    max: size == "max",
  };
  $: if (size != undefined) {
    dispatch("change", { size, breakpointValue: breakpoints[size] });
  }
</script>

<slot size="{size}" sizes="{sizes}" />
