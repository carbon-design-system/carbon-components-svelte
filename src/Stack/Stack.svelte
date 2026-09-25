<script>
  /**
   * @restProps {any}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  /**
   * Set to `true` to apply Stack's layout classes to a caller-supplied element or component
   * instead of the element named by `tag`. Props (including the computed classes and gap style)
   * are destructured as `props` in the default slot. `tag` is ignored when `as` is `true`.
   * @example
   * ```svelte
   * <Stack as orientation="horizontal" gap={3} let:props>
   *   <a {...props} href="/">Content</a>
   * </Stack>
   * ```
   */
  export let as = false;

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
   * Specify how items wrap onto multiple lines.
   * Items wrap when they overflow the main axis: the container width for a
   * horizontal stack, or a constrained height for a vertical stack.
   * @type {"nowrap" | "wrap" | "wrap-reverse"}
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
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--stack",
      inline && "bx--stack-inline",
      orientation === "vertical" && "bx--stack-vertical",
      orientation === "horizontal" && "bx--stack-horizontal",
      gap === 1 && "bx--stack-scale-1",
      gap === 2 && "bx--stack-scale-2",
      gap === 3 && "bx--stack-scale-3",
      gap === 4 && "bx--stack-scale-4",
      gap === 5 && "bx--stack-scale-5",
      gap === 6 && "bx--stack-scale-6",
      gap === 7 && "bx--stack-scale-7",
      gap === 8 && "bx--stack-scale-8",
      gap === 9 && "bx--stack-scale-9",
      gap === 10 && "bx--stack-scale-10",
      gap === 11 && "bx--stack-scale-11",
      gap === 12 && "bx--stack-scale-12",
      gap === 13 && "bx--stack-scale-13",
      align === "start" && "bx--stack-align-start",
      align === "center" && "bx--stack-align-center",
      align === "end" && "bx--stack-align-end",
      align === "baseline" && "bx--stack-align-baseline",
      justify === "start" && "bx--stack-justify-start",
      justify === "center" && "bx--stack-justify-center",
      justify === "end" && "bx--stack-justify-end",
      justify === "space-between" && "bx--stack-justify-space-between",
      justify === "space-around" && "bx--stack-justify-space-around",
      justify === "space-evenly" && "bx--stack-justify-space-evenly",
      wrap === "wrap" && "bx--stack-wrap",
      wrap === "wrap-reverse" && "bx--stack-wrap-reverse",
    ]
      .filter(Boolean)
      .join(" "),
    style:
      [$$restProps.style, typeof gap === "string" && `gap: ${gap}`]
        .filter(Boolean)
        .join("; ") || undefined,
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <svelte:element
    this={tag}
    bind:this={ref}
    {...props}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:scroll
    on:keydown
    on:keyup
    on:focusin
    on:focusout
  >
    <slot />
  </svelte:element>
{/if}
