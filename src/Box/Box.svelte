<script context="module">
  /**
   * Whether `value` is a spacing-scale step (rendered as a class rather
   * than inline style). Spacing steps start at 1; offsets also allow 0.
   * @param {unknown} value @param {number} min
   */
  function isScaleStep(value, min) {
    return typeof value === "number" && value >= min && value <= 13;
  }

  /** @param {string} kind @param {number | string | undefined} value @param {number} min */
  function scaleClass(kind, value, min) {
    if (value == null) return undefined;
    return isScaleStep(value, min) ? `bx--box-${kind}-${value}` : undefined;
  }

  /** @param {number | string | undefined} value @param {number} min */
  function scaleStyle(value, min) {
    if (value == null) return undefined;
    if (isScaleStep(value, min)) return undefined;
    if (typeof value === "string") return value;
    return undefined;
  }

  /** @param {"p" | "px" | "py" | "m" | "mx" | "my" | "height" | "min-height" | "max-height"} kind @param {SpacingValue | undefined} value */
  function spacingClass(kind, value) {
    return scaleClass(kind, value, 1);
  }

  /** @param {SpacingValue | undefined} value */
  function spacingStyle(value) {
    return scaleStyle(value, 1);
  }

  /**
   * Resolve `border-{side}-width` for the one side `borderSide`
   * targets; the other three sides are zeroed by the
   * `bx--box-border-side-{side}` class.
   * @param {"top" | "right" | "bottom" | "left"} side
   * @param {string | undefined} border
   * @param {"all" | "top" | "right" | "bottom" | "left"} borderSide
   * @param {number | string | undefined} borderWidth
   */
  function borderSideWidth(side, border, borderSide, borderWidth) {
    return border && borderSide === side ? toCssLength(borderWidth) : undefined;
  }

  /** @param {"height" | "min-height"} kind @param {SpacingValue | "viewport" | undefined} value */
  function viewportClass(kind, value) {
    if (value === "viewport") return `bx--box-${kind}-viewport`;
    return spacingClass(kind, value);
  }

  /** @param {SpacingValue | "viewport" | undefined} value */
  function viewportStyle(value) {
    if (value === "viewport") return undefined;
    return spacingStyle(value);
  }

  /** @param {"top" | "bottom"} kind @param {OffsetValue | undefined} value */
  function offsetClass(kind, value) {
    return scaleClass(kind, value, 0);
  }

  /** @param {OffsetValue | undefined} value */
  function offsetStyle(value) {
    return scaleStyle(value, 0);
  }
</script>

<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} SpacingScale
   * @typedef {SpacingScale | string} SpacingValue
   * @typedef {0 | SpacingScale | string} OffsetValue
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the background fill using a Carbon theme token.
   * @type {"background"
   *   | "layer-01"
   *   | "layer-02"
   *   | "layer-03"
   *   | "field"
   *   | "inverse"}
   */
  export let fill = undefined;

  /**
   * Set padding on all sides. Numbers `1`–`13` use the shared layout
   * scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let padding = undefined;

  /**
   * Set horizontal padding. Numbers `1`–`13` use the shared layout
   * scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingX = undefined;

  /**
   * Set vertical padding. Numbers `1`–`13` use the shared layout scale;
   * strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingY = undefined;

  /**
   * Set margin on all sides. Numbers `1`–`13` use the shared layout
   * scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let margin = undefined;

  /**
   * Set horizontal margin. Numbers `1`–`13` use the shared layout
   * scale; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginX = undefined;

  /**
   * Set vertical margin. Numbers `1`–`13` use the shared layout scale;
   * strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginY = undefined;

  /**
   * Set the border using a Carbon border token.
   * @type {"subtle" | "strong" | "interactive" | "disabled"}
   */
  export let border = undefined;

  /**
   * Set the border style. Only takes effect when `border` is set.
   * @type {"solid" | "dashed"}
   */
  export let borderStyle = "solid";

  /**
   * Set the border width. Only takes effect when `border` is set.
   * Numbers are treated as pixels; strings accept any CSS length.
   * @type {number | string | undefined}
   */
  export let borderWidth = undefined;

  /**
   * Set which side the border applies to. Only takes effect when
   * `border` is set.
   * @type {"all" | "top" | "right" | "bottom" | "left"}
   */
  export let borderSide = "all";

  /** Set to `true` to apply a Carbon raised box shadow. */
  export let shadow = false;

  /**
   * Set the width. Numbers are treated as pixels; strings accept any
   * CSS length.
   * @type {number | string | undefined}
   */
  export let width = undefined;

  /**
   * Set the max width. Numbers are treated as pixels; strings accept
   * any CSS length.
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Set the min width. Numbers are treated as pixels; strings accept
   * any CSS length.
   * @type {number | string | undefined}
   */
  export let minWidth = undefined;

  /** Set to `true` to span the full width of the container */
  export let fullWidth = false;

  /**
   * Set the height. Numbers `1`–`13` use the shared layout scale;
   * strings accept any CSS length; `"viewport"` sets the full viewport
   * height (`100dvh`, with a `100vh` fallback).
   * @type {SpacingValue | "viewport" | undefined}
   */
  export let height = undefined;

  /**
   * Set the min height. Numbers `1`–`13` use the shared layout scale;
   * strings accept any CSS length; `"viewport"` sets the full viewport
   * height (`100dvh`, with a `100vh` fallback).
   * @type {SpacingValue | "viewport" | undefined}
   */
  export let minHeight = undefined;

  /**
   * Set the max height. Numbers `1`–`13` use the shared layout scale;
   * strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let maxHeight = undefined;

  /**
   * Set the CSS position. `"sticky"` is relative to the nearest scroll
   * container, not the viewport.
   * @type {"relative" | "sticky" | undefined}
   */
  export let position = undefined;

  /**
   * Set the CSS display.
   * @type {"block" | "flex" | "inline-flex" | "grid" | undefined}
   */
  export let display = undefined;

  /**
   * Set the CSS overflow behavior.
   * @type {"visible" | "hidden" | "auto" | "scroll" | undefined}
   */
  export let overflow = undefined;

  /**
   * Set the offset from the top when `position` is set. Numbers
   * `0`–`13` use the shared layout scale; strings accept any CSS
   * length.
   * @type {OffsetValue | undefined}
   */
  export let top = undefined;

  /**
   * Set the offset from the bottom when `position` is set. Numbers
   * `0`–`13` use the shared layout scale; strings accept any CSS
   * length.
   * @type {OffsetValue | undefined}
   */
  export let bottom = undefined;

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

  import { toCssLength } from "../utils/css-length.js";

  $: boxClass = [
    fill && `bx--box-fill-${fill}`,
    border && `bx--box-border-${border}`,
    border && borderStyle === "dashed" && "bx--box-border-style-dashed",
    border && borderSide !== "all" && `bx--box-border-side-${borderSide}`,
    shadow && "bx--box-shadow",
    spacingClass("p", padding),
    spacingClass("px", paddingX),
    spacingClass("py", paddingY),
    spacingClass("m", margin),
    spacingClass("mx", marginX),
    spacingClass("my", marginY),
    fullWidth && "bx--box-full-width",
    viewportClass("height", height),
    viewportClass("min-height", minHeight),
    spacingClass("max-height", maxHeight),
    position && `bx--box-position-${position}`,
    display && `bx--box-display-${display}`,
    overflow && `bx--box-overflow-${overflow}`,
    offsetClass("top", top),
    offsetClass("bottom", bottom),
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  $: resolvedWidth = toCssLength(width);
  $: resolvedMaxWidth = toCssLength(maxWidth);
  $: resolvedMinWidth = toCssLength(minWidth);
  $: resolvedBorderWidth =
    border && borderSide === "all" ? toCssLength(borderWidth) : undefined;
  $: resolvedBorderTopWidth = borderSideWidth(
    "top",
    border,
    borderSide,
    borderWidth,
  );
  $: resolvedBorderRightWidth = borderSideWidth(
    "right",
    border,
    borderSide,
    borderWidth,
  );
  $: resolvedBorderBottomWidth = borderSideWidth(
    "bottom",
    border,
    borderSide,
    borderWidth,
  );
  $: resolvedBorderLeftWidth = borderSideWidth(
    "left",
    border,
    borderSide,
    borderWidth,
  );
  $: resolvedPadding = spacingStyle(padding);
  $: resolvedPaddingX = spacingStyle(paddingX);
  $: resolvedPaddingY = spacingStyle(paddingY);
  $: resolvedMargin = spacingStyle(margin);
  $: resolvedMarginX = spacingStyle(marginX);
  $: resolvedMarginY = spacingStyle(marginY);
  $: resolvedHeight = viewportStyle(height);
  $: resolvedMinHeight = viewportStyle(minHeight);
  $: resolvedMaxHeight = spacingStyle(maxHeight);
  $: resolvedTop = offsetStyle(top);
  $: resolvedBottom = offsetStyle(bottom);
</script>

<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  style:width={resolvedWidth}
  style:max-width={resolvedMaxWidth}
  style:min-width={resolvedMinWidth}
  style:border-width={resolvedBorderWidth}
  style:border-top-width={resolvedBorderTopWidth}
  style:border-right-width={resolvedBorderRightWidth}
  style:border-bottom-width={resolvedBorderBottomWidth}
  style:border-left-width={resolvedBorderLeftWidth}
  style:padding={resolvedPadding}
  style:padding-inline={resolvedPaddingX}
  style:padding-block={resolvedPaddingY}
  style:margin={resolvedMargin}
  style:margin-inline={resolvedMarginX}
  style:margin-block={resolvedMarginY}
  style:height={resolvedHeight}
  style:min-height={resolvedMinHeight}
  style:max-height={resolvedMaxHeight}
  style:top={resolvedTop}
  style:bottom={resolvedBottom}
  class={boxClass}
>
  <slot />
</svelte:element>
