<script>
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
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

  /**
   * Specify the cross-axis alignment of items in the stack.
   * @type {"start" | "center" | "end" | "stretch" | "baseline"}
   */
  export let align = "stretch";

  /**
   * Specify the main-axis alignment of items in the stack.
   * @type {"start" | "center" | "end" | "space-between" | "space-around" | "space-evenly"}
   */
  export let justify = "start";

  /**
   * Set to `true` to use `display: inline-flex` instead of `display: flex`.
   */
  export let inline = false;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";
</script>

<svelte:element
  this={tag}
  class:bx--stack={true}
  class:bx--stack-inline={inline}
  class:bx--stack-vertical={orientation === "vertical"}
  class:bx--stack-horizontal={orientation === "horizontal"}
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
  class:bx--stack-align-start={align === "start"}
  class:bx--stack-align-center={align === "center"}
  class:bx--stack-align-end={align === "end"}
  class:bx--stack-align-baseline={align === "baseline"}
  class:bx--stack-justify-start={justify === "start"}
  class:bx--stack-justify-center={justify === "center"}
  class:bx--stack-justify-end={justify === "end"}
  class:bx--stack-justify-space-between={justify === "space-between"}
  class:bx--stack-justify-space-around={justify === "space-around"}
  class:bx--stack-justify-space-evenly={justify === "space-evenly"}
  style:gap={typeof gap === "string" ? gap : undefined}
  {...$$restProps}
>
  <slot />
</svelte:element>
