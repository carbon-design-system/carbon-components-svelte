<script context="module">
  /** @param {unknown} value */
  function isScaleStep(value) {
    return typeof value === "number" && value >= 1 && value <= 13;
  }
</script>

<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} SpacingScale
   * @typedef {SpacingScale | string} SpacingValue
   * @restProps {hr}
   */

  /**
   * Specify the orientation of the divider.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * Set to `true` to render a decorative divider with no separator semantics
   * (no `role`, `aria-hidden="true"`) instead of `role="separator"`.
   */
  export let decorative = false;

  /**
   * Set the margin on the divider's own axis: block margin (`margin-block`)
   * when `orientation` is `"horizontal"`, inline margin (`margin-inline`)
   * when `"vertical"`. Numbers `1`–`13` use the shared spacing scale;
   * strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let margin = undefined;

  $: marginClass = isScaleStep(margin)
    ? `bx--divider-margin-${orientation === "vertical" ? "x" : "y"}-${margin}`
    : undefined;

  $: marginStyleValue = typeof margin === "string" ? margin : undefined;

  $: dividerClass = [
    "bx--divider",
    `bx--divider--${orientation}`,
    marginClass,
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<hr
  {...$$restProps}
  role={decorative ? undefined : "separator"}
  aria-orientation={!decorative && orientation === "vertical"
    ? "vertical"
    : undefined}
  aria-hidden={decorative ? "true" : undefined}
  style:margin-block={orientation === "horizontal"
    ? marginStyleValue
    : undefined}
  style:margin-inline={orientation === "vertical"
    ? marginStyleValue
    : undefined}
  class={dividerClass}
>
