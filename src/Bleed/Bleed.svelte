<script context="module">
  /** @param {unknown} value */
  function isScaleStep(value) {
    return typeof value === "number" && value >= 1 && value <= 13;
  }

  /** @param {"top" | "right" | "bottom" | "left"} side @param {SpacingValue | undefined} value */
  function scaleClass(side, value) {
    return isScaleStep(value) ? `bx--bleed-${side}-${value}` : undefined;
  }

  /**
   * Negate a custom length. `calc()` keeps CSS variables and `calc()`
   * expressions valid, where a bare `-` prefix would not.
   * @param {SpacingValue | undefined} value
   */
  function negatedStyle(value) {
    return typeof value === "string" ? `calc(-1 * (${value}))` : undefined;
  }
</script>

<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} SpacingScale
   * @typedef {SpacingScale | string} SpacingValue
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set a negative margin on the left and right edges. Numbers `1`–`13` use the shared layout scale, cancelling `Box`'s `paddingX` at the same step; strings accept any CSS length. Overridden per side by `left`/`right`.
   * @type {SpacingValue | undefined}
   */
  export let horizontal = undefined;

  /**
   * Set a negative margin on the top and bottom edges. Numbers `1`–`13` use the shared layout scale, cancelling `Box`'s `paddingY` at the same step; strings accept any CSS length. Overridden per side by `top`/`bottom`.
   * @type {SpacingValue | undefined}
   */
  export let vertical = undefined;

  /**
   * Set a negative margin on the top edge only, overriding `vertical`.
   * @type {0 | SpacingValue | undefined}
   */
  export let top = undefined;

  /**
   * Set a negative margin on the right edge only, overriding `horizontal`.
   * @type {0 | SpacingValue | undefined}
   */
  export let right = undefined;

  /**
   * Set a negative margin on the bottom edge only, overriding `vertical`.
   * @type {0 | SpacingValue | undefined}
   */
  export let bottom = undefined;

  /**
   * Set a negative margin on the left edge only, overriding `horizontal`.
   * @type {0 | SpacingValue | undefined}
   */
  export let left = undefined;

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

  $: resolvedTop = top ?? vertical;
  $: resolvedRight = right ?? horizontal;
  $: resolvedBottom = bottom ?? vertical;
  $: resolvedLeft = left ?? horizontal;

  $: bleedClass = [
    "bx--bleed",
    scaleClass("top", resolvedTop),
    scaleClass("right", resolvedRight),
    scaleClass("bottom", resolvedBottom),
    scaleClass("left", resolvedLeft),
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  style:margin-top={negatedStyle(resolvedTop)}
  style:margin-right={negatedStyle(resolvedRight)}
  style:margin-bottom={negatedStyle(resolvedBottom)}
  style:margin-left={negatedStyle(resolvedLeft)}
  class={bleedClass}
>
  <slot />
</svelte:element>
