<script context="module">
  /**
   * Whether `value` is a spacing-scale step (rendered as a class rather than
   * inline style). Spacing steps start at 1; offsets also allow 0.
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
    if (value === 0) return "0";
    return undefined;
  }

  /** @param {"p" | "px" | "py" | "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml" | "gap" | "height" | "min-height" | "max-height"} kind @param {SpacingValue | undefined} value */
  function spacingClass(kind, value) {
    return scaleClass(kind, value, 1);
  }

  /** @param {SpacingValue | undefined} value */
  function spacingStyle(value) {
    return scaleStyle(value, 1);
  }

  /**
   * Resolve `border-{side}-width` for the one side `borderSide` targets;
   * the other three sides are zeroed by the `bx--box-border-side-{side}` class.
   * @param {"top" | "right" | "bottom" | "left"} side
   * @param {string | undefined} border
   * @param {"all" | "top" | "right" | "bottom" | "left"} borderSide
   * @param {number | string | undefined} borderWidth
   */
  function borderSideWidth(side, border, borderSide, borderWidth) {
    return border && borderSide === side ? toCssLength(borderWidth) : undefined;
  }

  /** @param {number | string | undefined} value */
  function gridColumns(value) {
    if (value == null) return undefined;
    if (typeof value === "number") return `repeat(${value}, minmax(0, 1fr))`;
    return value;
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

  /** @param {"top" | "bottom" | "left" | "right"} kind @param {OffsetValue | undefined} value */
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
   * @typedef {0 | SpacingScale | string} SpacingValue
   * @typedef {0 | SpacingScale | string} OffsetValue
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the background fill using a Carbon theme token.
   * @type {"background" | "layer-01" | "layer-02" | "layer-03" | "layer-accent" | "field" | "inverse" | "brand"}
   */
  export let fill = undefined;

  /**
   * Set padding on all sides. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let padding = undefined;

  /**
   * Set horizontal padding. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingX = undefined;

  /**
   * Set vertical padding. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let paddingY = undefined;

  /**
   * Set margin on all sides. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let margin = undefined;

  /**
   * Set horizontal margin. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginX = undefined;

  /**
   * Set vertical margin. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginY = undefined;

  /**
   * Set the top margin, overriding `margin` and `marginY` on that side. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginTop = undefined;

  /**
   * Set the right margin, overriding `margin` and `marginX` on that side. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginRight = undefined;

  /**
   * Set the bottom margin, overriding `margin` and `marginY` on that side. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginBottom = undefined;

  /**
   * Set the left margin, overriding `margin` and `marginX` on that side. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let marginLeft = undefined;

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
   * Set the border width. Only takes effect when `border` is set. Numbers are treated as pixels; strings accept any CSS length.
   * @type {number | string | undefined}
   */
  export let borderWidth = undefined;

  /**
   * Set which side the border applies to. Only takes effect when `border` is set.
   * @type {"all" | "top" | "right" | "bottom" | "left"}
   */
  export let borderSide = "all";

  /** Set to `true` to apply a Carbon raised box shadow. */
  export let shadow = false;

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
   * Set the height. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length; `"viewport"` sets the full viewport height (`100dvh`, with a `100vh` fallback).
   * @type {SpacingValue | "viewport" | undefined}
   */
  export let height = undefined;

  /**
   * Set the min height. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length; `"viewport"` sets the full viewport height (`100dvh`, with a `100vh` fallback).
   * @type {SpacingValue | "viewport" | undefined}
   */
  export let minHeight = undefined;

  /**
   * Set the max height. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length.
   * @type {SpacingValue | undefined}
   */
  export let maxHeight = undefined;

  /**
   * Set the CSS position. `"sticky"` is relative to the nearest scroll container, not the viewport.
   * @type {"relative" | "sticky" | undefined}
   */
  export let position = undefined;

  /**
   * Set the CSS display.
   * @type {"block" | "flex" | "inline-flex" | "grid" | undefined}
   */
  export let display = undefined;

  /**
   * Set the flex direction of children. Only takes effect when `display` is
   * `"flex"` or `"inline-flex"`.
   * @type {"row" | "column" | undefined}
   */
  export let direction = undefined;

  /**
   * Set the gap between children. Numbers `1`–`13` use the shared layout scale, `0` clears it; strings accept any CSS length. Only takes effect when `display` is `"flex"`, `"inline-flex"`, or `"grid"`.
   * @type {SpacingValue | undefined}
   */
  export let gap = undefined;

  /**
   * Set the grid columns. Numbers create that many equal-width columns; strings set `grid-template-columns` directly. Only takes effect when `display` is `"grid"`.
   * @type {number | string | undefined}
   */
  export let columns = undefined;

  /**
   * Set the cross-axis alignment of children. Only takes effect when
   * `display` is `"flex"`, `"inline-flex"`, or `"grid"`.
   * @type {"start"
   *   | "center"
   *   | "end"
   *   | "stretch"
   *   | "baseline"
   *   | undefined}
   */
  export let align = undefined;

  /**
   * Set the main-axis alignment of children. Only takes effect when
   * `display` is `"flex"`, `"inline-flex"`, or `"grid"`.
   * @type {"start"
   *   | "center"
   *   | "end"
   *   | "space-between"
   *   | "space-around"
   *   | "space-evenly"
   *   | undefined}
   */
  export let justify = undefined;

  /**
   * Set how flex children wrap onto multiple lines. Only takes effect when
   * `display` is `"flex"` or `"inline-flex"`.
   * @type {"nowrap" | "wrap" | "wrap-reverse" | undefined}
   */
  export let wrap = undefined;

  /**
   * Set this box's own cross-axis alignment inside a flex or grid parent,
   * overriding the parent's `align`.
   * @type {"start" | "center" | "end" | "stretch" | "baseline" | undefined}
   */
  export let alignSelf = undefined;

  /** Set to `true` to let this box grow to fill free space inside a flex parent. */
  export let grow = false;

  /**
   * Set the CSS overflow behavior.
   * @type {"visible" | "hidden" | "auto" | "scroll" | undefined}
   */
  export let overflow = undefined;

  /**
   * Set the CSS horizontal overflow behavior. Overrides `overflow` on that axis.
   * @type {"visible" | "hidden" | "auto" | "scroll" | undefined}
   */
  export let overflowX = undefined;

  /**
   * Set the CSS vertical overflow behavior. Overrides `overflow` on that axis.
   * @type {"visible" | "hidden" | "auto" | "scroll" | undefined}
   */
  export let overflowY = undefined;

  /**
   * Set the offset from the top when `position` is set. Numbers `0`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {OffsetValue | undefined}
   */
  export let top = undefined;

  /**
   * Set the offset from the bottom when `position` is set. Numbers `0`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {OffsetValue | undefined}
   */
  export let bottom = undefined;

  /**
   * Set the offset from the left when `position` is set. Numbers `0`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {OffsetValue | undefined}
   */
  export let left = undefined;

  /**
   * Set the offset from the right when `position` is set. Numbers `0`–`13` use the shared layout scale; strings accept any CSS length.
   * @type {OffsetValue | undefined}
   */
  export let right = undefined;

  /**
   * Hide the box below this breakpoint. It stays visible at the breakpoint and above.
   * @type {"sm" | "md" | "lg" | "xlg" | "max" | undefined}
   */
  export let hideBelow = undefined;

  /**
   * Hide the box above this breakpoint. It stays visible at the breakpoint and below.
   * @type {"sm" | "md" | "lg" | "xlg" | "max" | undefined}
   */
  export let hideAbove = undefined;

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
    spacingClass("mt", marginTop),
    spacingClass("mr", marginRight),
    spacingClass("mb", marginBottom),
    spacingClass("ml", marginLeft),
    fullWidth && "bx--box-full-width",
    viewportClass("height", height),
    viewportClass("min-height", minHeight),
    spacingClass("max-height", maxHeight),
    position && `bx--box-position-${position}`,
    display && `bx--box-display-${display}`,
    direction && `bx--box-direction-${direction}`,
    spacingClass("gap", gap),
    align && `bx--box-align-${align}`,
    justify && `bx--box-justify-${justify}`,
    wrap && `bx--box-wrap-${wrap}`,
    alignSelf && `bx--box-align-self-${alignSelf}`,
    grow && "bx--box-grow",
    overflow && `bx--box-overflow-${overflow}`,
    overflowX && `bx--box-overflow-x-${overflowX}`,
    overflowY && `bx--box-overflow-y-${overflowY}`,
    offsetClass("top", top),
    offsetClass("bottom", bottom),
    offsetClass("left", left),
    offsetClass("right", right),
    hideBelow && `bx--box-hide-below-${hideBelow}`,
    hideAbove && `bx--box-hide-above-${hideAbove}`,
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
  // An inline `margin` or `margin-inline` would beat a side's scale class, so
  // once any side is set, every inline margin resolves per side instead.
  $: marginSplit =
    marginTop != null ||
    marginRight != null ||
    marginBottom != null ||
    marginLeft != null;
  $: resolvedMargin = marginSplit ? undefined : spacingStyle(margin);
  $: resolvedMarginX = marginSplit ? undefined : spacingStyle(marginX);
  $: resolvedMarginY = marginSplit ? undefined : spacingStyle(marginY);
  $: resolvedMarginTop = marginSplit
    ? spacingStyle(marginTop ?? marginY ?? margin)
    : undefined;
  $: resolvedMarginRight = marginSplit
    ? spacingStyle(marginRight ?? marginX ?? margin)
    : undefined;
  $: resolvedMarginBottom = marginSplit
    ? spacingStyle(marginBottom ?? marginY ?? margin)
    : undefined;
  $: resolvedMarginLeft = marginSplit
    ? spacingStyle(marginLeft ?? marginX ?? margin)
    : undefined;
  $: resolvedHeight = viewportStyle(height);
  $: resolvedMinHeight = viewportStyle(minHeight);
  $: resolvedMaxHeight = spacingStyle(maxHeight);
  $: resolvedGap = spacingStyle(gap);
  $: resolvedColumns = display === "grid" ? gridColumns(columns) : undefined;
  $: resolvedTop = offsetStyle(top);
  $: resolvedBottom = offsetStyle(bottom);
  $: resolvedLeft = offsetStyle(left);
  $: resolvedRight = offsetStyle(right);
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
  style:margin-top={resolvedMarginTop}
  style:margin-right={resolvedMarginRight}
  style:margin-bottom={resolvedMarginBottom}
  style:margin-left={resolvedMarginLeft}
  style:height={resolvedHeight}
  style:min-height={resolvedMinHeight}
  style:max-height={resolvedMaxHeight}
  style:gap={resolvedGap}
  style:grid-template-columns={resolvedColumns}
  style:top={resolvedTop}
  style:bottom={resolvedBottom}
  style:left={resolvedLeft}
  style:right={resolvedRight}
  class={boxClass}
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
