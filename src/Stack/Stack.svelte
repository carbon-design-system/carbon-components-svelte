<script>
  import { responsiveClasses } from "../utils/responsive-classes.js";

  /** @typedef {import("../Breakpoint/breakpoints").BreakpointSize} BreakpointSize */

  const BREAKPOINTS = ["sm", "md", "lg", "xlg", "max"];

  /**
   * The stack scale maps to the following `@carbon/layout` values:
   * - 0  --> 0 (no gap)
   * - 1  --> 0.125rem
   * - 2  --> 0.25rem
   * - 3  --> 0.5rem
   * - 4  --> 0.75rem
   * - 5  --> 1rem
   * - 6  --> 1.5rem
   * - 7  --> 2rem
   * - 8  --> 2.5rem
   * - 9  --> 3rem
   * - 10 --> 4rem
   * - 11 --> 5rem
   * - 12 --> 6rem
   * - 13 --> 10rem
   * @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} StackScale
   */

  /**
   * Specify the gap between items in the stack.
   * The scale maps to Carbon layout values.
   * Use 0 to omit any gap class.
   * Alternatively, specify a custom value (e.g., "200px" or "1.5rem").
   * Custom values *must* be a string.
   * @type {StackScale | string}
   */
  export let gap = 1;

  /**
   * Specify the orientation of the stack.
   * Accepts a breakpoint object (e.g., `{ sm: "vertical", md: "horizontal" }`) resolved mobile-first.
   * @type {"vertical" | "horizontal" | Partial<Record<BreakpointSize, "vertical" | "horizontal">>}
   */
  export let orientation = "vertical";

  /**
   * Specify the cross-axis alignment of items in the stack.
   * Accepts a breakpoint object resolved mobile-first.
   * @type {"start" | "center" | "end" | "stretch" | "baseline" | Partial<Record<BreakpointSize, "start" | "center" | "end" | "stretch" | "baseline">>}
   */
  export let align = "stretch";

  /**
   * Specify the main-axis alignment of items in the stack.
   * Accepts a breakpoint object resolved mobile-first.
   * @type {"start" | "center" | "end" | "space-between" | "space-around" | "space-evenly" | Partial<Record<BreakpointSize, "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly">>}
   */
  export let justify = "start";

  /**
   * Specify how items wrap onto multiple lines.
   * Only applies to horizontal stacks that overflow their container.
   * Accepts a breakpoint object resolved mobile-first.
   * @type {"nowrap" | "wrap" | "wrap-reverse" | Partial<Record<BreakpointSize, "nowrap" | "wrap" | "wrap-reverse">>}
   */
  export let wrap = "nowrap";

  /**
   * Set to `true` to use `display: inline-flex` instead of `display: flex`.
   */
  export let inline = false;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Drop a value equal to `defaultValue` at the `sm` position (or a bare
   * scalar) so no class is emitted for it, matching the implicit CSS
   * default. Explicit values at other breakpoints are kept so they can
   * undo a value set at a smaller breakpoint.
   * @param {string | Partial<Record<BreakpointSize, string>> | undefined} value
   * @param {string} defaultValue
   */
  function withoutDefaultAtSm(value, defaultValue) {
    if (typeof value !== "object" || value === null) {
      return value === defaultValue ? undefined : value;
    }
    if (value.sm !== defaultValue) return value;
    const { sm, ...rest } = value;
    return rest;
  }

  $: stackClasses = responsiveClasses("bx--stack", orientation, BREAKPOINTS);
  $: alignClasses = responsiveClasses(
    "bx--stack-align",
    withoutDefaultAtSm(align, "stretch"),
    BREAKPOINTS,
  );
  $: justifyClasses = responsiveClasses(
    "bx--stack-justify",
    justify,
    BREAKPOINTS,
  );
  $: wrapClasses = responsiveClasses(
    "bx--stack",
    withoutDefaultAtSm(wrap, "nowrap"),
    BREAKPOINTS,
  );
</script>

<svelte:element
  this={tag}
  class:bx--stack={true}
  class:bx--stack-inline={inline}
  class:bx--stack-scale-1={gap === 1}
  class:bx--stack-scale-2={gap === 2}
  class:bx--stack-scale-3={gap === 3}
  class:bx--stack-scale-4={gap === 4}
  class:bx--stack-scale-5={gap === 5}
  class:bx--stack-scale-6={gap === 6}
  class:bx--stack-scale-7={gap === 7}
  class:bx--stack-scale-8={gap === 8}
  class:bx--stack-scale-9={gap === 9}
  class:bx--stack-scale-10={gap === 10}
  class:bx--stack-scale-11={gap === 11}
  class:bx--stack-scale-12={gap === 12}
  class:bx--stack-scale-13={gap === 13}
  {...$$restProps}
  class={[...stackClasses, ...alignClasses, ...justifyClasses, ...wrapClasses]
    .concat($$restProps.class)
    .filter(Boolean)
    .join(" ")}
  style:gap={typeof gap === "string" ? gap : undefined}
>
  <slot />
</svelte:element>
