<script>
  /**
   * @typedef {"sm" | "md" | "lg" | "xlg" | "max"} BreakpointSize
   * @typedef {320 | 672 | 1056 | 1312 | 1584} BreakpointValue
   * @event change
   * @type {object}
   * @property {BreakpointSize} size
   * @property {BreakpointValue} breakpointValue
   * @slot {{ size: BreakpointSize; sizes: Record<BreakpointSize, boolean>; }}
   */

  /**
   * Determine the current Carbon grid breakpoint size.
   * @type {BreakpointSize}
   * @bindable readonly
   */
  export let size = undefined;

  /**
   * Carbon grid sizes as an object.
   * @type {Record<BreakpointSize, boolean>}
   * @bindable readonly
   */
  export let sizes = {
    sm: false,
    md: false,
    lg: false,
    xlg: false,
    max: false,
  };

  /**
   * Size assumed before the first measurement (SSR) and when `matchMedia`
   * is unavailable. `change` does not fire for the fallback.
   * @type {BreakpointSize}
   */
  export let fallback = undefined;

  import { createEventDispatcher } from "svelte";
  import { breakpointObserver } from "./breakpoint-observer.js";
  import { breakpoints } from "./breakpoints.js";

  const dispatch = createEventDispatcher();
  const observer = breakpointObserver();

  $: size = $observer ?? fallback;
  $: sizes = {
    sm: size === "sm",
    md: size === "md",
    lg: size === "lg",
    xlg: size === "xlg",
    max: size === "max",
  };
  $: if ($observer !== undefined)
    // svelte-ignore reactive_declaration_non_reactive_property
    dispatch("change", { size, breakpointValue: breakpoints[size] });
</script>

<slot {size} {sizes} />
