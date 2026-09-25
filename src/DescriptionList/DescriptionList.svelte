<script>
  /**
   * The gap scale maps to the following `@carbon/layout` values:
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
   * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} DescriptionListScale
   * @restProps {dl}
   * @slot {{}}
   */

  /**
   * Specify whether each term/detail pair stacks (term above detail)
   * or sits side by side (term beside detail).
   * @type {"vertical" | "horizontal"}
   */
  export let layout = "vertical";

  /**
   * Specify the gap between items.
   * The scale maps to Carbon layout values.
   * Alternatively, specify a custom value (e.g., "22px" or "1.5rem").
   * Custom values *must* be a string.
   * @type {DescriptionListScale | string}
   */
  export let gap = 5;

  /** Specify the number of columns to lay items out in. */
  export let columns = 1;
</script>

<dl
  class:bx--description-list={true}
  class:bx--description-list--horizontal={layout === "horizontal"}
  class:bx--description-list--columns={columns > 1}
  class:bx--description-list-gap-1={gap === 1}
  class:bx--description-list-gap-2={gap === 2}
  class:bx--description-list-gap-3={gap === 3}
  class:bx--description-list-gap-4={gap === 4}
  class:bx--description-list-gap-5={gap === 5}
  class:bx--description-list-gap-6={gap === 6}
  class:bx--description-list-gap-7={gap === 7}
  class:bx--description-list-gap-8={gap === 8}
  class:bx--description-list-gap-9={gap === 9}
  class:bx--description-list-gap-10={gap === 10}
  class:bx--description-list-gap-11={gap === 11}
  class:bx--description-list-gap-12={gap === 12}
  class:bx--description-list-gap-13={gap === 13}
  style:gap={typeof gap === "string" ? gap : undefined}
  style:grid-template-columns={columns > 1
    ? `repeat(${columns}, minmax(0, 1fr))`
    : undefined}
  {...$$restProps}
>
  <slot />
</dl>
