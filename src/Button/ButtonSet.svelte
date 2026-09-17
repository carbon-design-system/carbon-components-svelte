<script>
  import { responsiveClasses } from "../utils/responsive-classes.js";

  /** @typedef {import("../Breakpoint/breakpoints").BreakpointSize} BreakpointSize */

  const BREAKPOINTS = ["sm", "md", "lg", "xlg", "max"];

  /**
   * @restProps {div}
   */

  /**
   * Set to `true` to stack the buttons vertically.
   * Accepts a breakpoint object (e.g., `{ sm: true, lg: false }`) resolved mobile-first.
   * @type {boolean | Partial<Record<BreakpointSize, boolean>>}
   */
  export let stacked = false;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  $: stackedClasses = responsiveClasses(
    "bx--btn-set--stacked",
    stacked,
    BREAKPOINTS,
  );
</script>

<div
  bind:this={ref}
  class:bx--btn-set={true}
  {...$$restProps}
  class={stackedClasses
    .concat($$restProps.class)
    .filter(Boolean)
    .join(" ")}
>
  <slot />
</div>
