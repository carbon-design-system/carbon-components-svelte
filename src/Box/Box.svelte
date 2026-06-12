<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} SpacingScale
   * @typedef {SpacingScale | string} SpacingValue
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the background fill using a Carbon theme token.
   * @type {"background" | "layer-01" | "layer-02" | "layer-03" | "field" | "inverse"}
   */
  export let fill = undefined;

  /**
   * Set padding on all sides. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let padding = undefined;

  /**
   * Set horizontal padding. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingX = undefined;

  /**
   * Set vertical padding. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingY = undefined;

  /**
   * Set margin on all sides. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let margin = undefined;

  /**
   * Set horizontal margin. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginX = undefined;

  /**
   * Set vertical margin. Numbers `1`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginY = undefined;

  /**
   * Set the border using a Carbon border token.
   * @type {"subtle" | "strong" | "interactive" | "disabled"}
   */
  export let border = undefined;

  /**
   * Set the width. Numbers are treated as pixels; strings accept any CSS length.
   * @type {number | string | undefined}
   */
  export let width = undefined;

  /**
   * Set the max width. Numbers are treated as pixels; strings accept any CSS length.
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Set the min width. Numbers are treated as pixels; strings accept any CSS length.
   * @type {number | string | undefined}
   */
  export let minWidth = undefined;

  /** Set to `true` to span the full width of the container */
  export let fullWidth = false;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /** @param {"p" | "px" | "py" | "m" | "mx" | "my"} kind @param {SpacingValue | undefined} value */
  function spacingClass(kind, value) {
    if (value == null) return undefined;
    if (typeof value === "number" && value >= 1 && value <= 13) {
      return `bx--box-${kind}-${value}`;
    }
    return undefined;
  }

  /** @param {SpacingValue | undefined} value */
  function spacingStyle(value) {
    if (value == null) return undefined;
    if (typeof value === "number" && value >= 1 && value <= 13) {
      return undefined;
    }
    if (typeof value === "string") return value;
    return undefined;
  }

  /** @param {number | string | undefined} value */
  function lengthStyle(value) {
    if (value == null) return undefined;
    return typeof value === "number" ? `${value}px` : value;
  }

  $: boxClass = [
    fill && `bx--box-fill-${fill}`,
    border && `bx--box-border-${border}`,
    spacingClass("p", padding),
    spacingClass("px", paddingX),
    spacingClass("py", paddingY),
    spacingClass("m", margin),
    spacingClass("mx", marginX),
    spacingClass("my", marginY),
    fullWidth && "bx--box-full-width",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  $: resolvedWidth = lengthStyle(width);
  $: resolvedMaxWidth = lengthStyle(maxWidth);
  $: resolvedMinWidth = lengthStyle(minWidth);
  $: resolvedPadding = spacingStyle(padding);
  $: resolvedPaddingX = spacingStyle(paddingX);
  $: resolvedPaddingY = spacingStyle(paddingY);
  $: resolvedMargin = spacingStyle(margin);
  $: resolvedMarginX = spacingStyle(marginX);
  $: resolvedMarginY = spacingStyle(marginY);
</script>

<svelte:element
  this={tag}
  {...$$restProps}
  style:width={resolvedWidth}
  style:max-width={resolvedMaxWidth}
  style:min-width={resolvedMinWidth}
  style:padding={resolvedPadding}
  style:padding-inline={resolvedPaddingX}
  style:padding-block={resolvedPaddingY}
  style:margin={resolvedMargin}
  style:margin-inline={resolvedMarginX}
  style:margin-block={resolvedMarginY}
  class={boxClass}
>
  <slot />
</svelte:element>
