<script>
  /**
   * @restProps {div}
   * @template {number | `${number}px`} [Size=number]
   * @slot {{}} start - Content of the start pane, sized by `size`.
   * @slot {{}} end - Content of the end pane, which fills the remaining space.
   * @event {{ size: Size }} resize - Fires once the user finishes resizing (drag release, key press, or double click) and the size changed. `size` is in the unit `size` was given in.
   */

  /**
   * Specify the size of the start pane, as a percentage of the splitter,
   * or as a pixel length such as `"240px"` that the pane holds while the
   * splitter resizes. Resizing writes back in the same unit, rounded to
   * whole pixels. Rendered clamped to `[min, max]`.
   * @type {Size}
   * @bindable writable
   */
  export let size = /** @type {Size} */ (50);

  /**
   * Set to `true` to collapse the start pane to `collapsedSize`, or `min`
   * when that is unset, and back to `false` to restore the size it had
   * before. Moving the separator there by any means also sets it to `true`.
   * @bindable writable
   */
  export let collapsed = false;

  /**
   * Set the size the start pane collapses to, below `min`, as a percentage
   * or a pixel length. Dragging past halfway between `min` and this size
   * snaps the pane collapsed, and dragging back snaps it open.
   * Defaults to `min`, so the pane collapses no further than it resizes.
   * @type {number | `${number}px` | undefined}
   */
  export let collapsedSize = undefined;

  /**
   * Set the minimum size of the start pane, as a percentage, or as a pixel
   * length such as `"240px"` that holds while the splitter resizes.
   * @type {number | `${number}px`}
   */
  export let min = 0;

  /**
   * Set the maximum size of the start pane, as a percentage, or as a pixel
   * length such as `"480px"`. A `min` larger than `max` wins.
   * @type {number | `${number}px`}
   */
  export let max = 100;

  /**
   * Set the percentage of the splitter an arrow key moves the separator.
   * Shift + arrow key moves 10 times as far. With a pixel `size`, the
   * distance is converted to pixels.
   */
  export let step = 1;

  /**
   * Set the direction the panes are laid out in.
   * `"horizontal"` places them side by side with a vertical separator;
   * `"vertical"` stacks them with a horizontal separator.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /** Set to `true` to prevent resizing */
  export let disabled = false;

  /** Specify the ARIA label for the separator */
  export let separatorLabel = "Resize panes";

  /**
   * Specify the delay in milliseconds before hovering the separator
   * highlights it and shows the resize cursor.
   * Defaults to the enclosing `Splitter`'s delay, or `150`.
   * @type {number | undefined}
   */
  export let enterDelayMs = undefined;

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Set an id for the top-level element.
   * The start pane id derives from it as `{id}-start`.
   */
  export let id = useId("splitter");

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { SEPARATOR_HOVER_DELAY_MS } from "../constants/timing.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { useId } from "../utils/id-scope.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { clamp } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";

  const LARGE_STEP_MULTIPLIER = 10;

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {undefined | { enterDelayMs: () => number }} */
  const parent = getContext("carbon:Splitter");

  // Nested splitters without their own delay use this one's.
  setContext("carbon:Splitter", {
    /** @type {() => number} */
    enterDelayMs: () => resolvedEnterDelayMs,
  });

  const scheduleHover = createDelayedSetter();
  // Set once the pointer has rested on the separator for the enter delay.
  let hovered = false;

  // Double-clicking the separator restores the size the splitter started at.
  const initialSize = size;

  let resizing = false;
  let dragStartPoint = 0;
  let dragStartSize = 0;
  let dragDirection = 1;
  // Size that Enter or `collapsed = false` restores after the start pane
  // reaches `min`, in the unit `size` had then.
  let expandedSize = size;
  // The `collapsed` value last matched to the size; a difference means the
  // prop was set from outside. Starts `false` so `collapsed={true}` on
  // mount collapses the pane.
  let syncedCollapsed = false;

  // The splitter's size, measured only while `size`, `min`, `max` or
  // `collapsedSize` is in pixels.
  let containerSize = { width: 0, height: 0 };
  let stopObserving = noop;

  /**
   * @param {null | HTMLElement} node
   * @param {boolean} enabled
   */
  function observeContainer(node, enabled) {
    stopObserving();
    stopObserving =
      node && enabled
        ? observeResize(node, (entry) => {
            const { width, height } = entry.contentRect;
            containerSize = { width, height };
          })
        : noop;
  }

  // A pixel bound as a percentage of `length`. Until the splitter is
  // measured, and on the server, the pane's inline min/max size holds it.
  /**
   * @param {number | `${number}px`} bound
   * @param {number} length
   * @param {number} fallback
   */
  function toPercent(bound, length, fallback) {
    if (typeof bound === "number") return bound;
    return pixelsToPercent(Number.parseFloat(bound), length, fallback);
  }

  /**
   * @param {number} pixels
   * @param {number} length
   * @param {number} fallback
   */
  function pixelsToPercent(pixels, length, fallback) {
    if (!length) return fallback;
    return Math.round(clamp((pixels / length) * 100, 0, 100) * 100) / 100;
  }

  // A size or bound in whole pixels, held within the splitter once it is
  // measured. A percentage needs the measurement; until then, and on the
  // server, the pane's inline min/max size holds it.
  /**
   * @param {number | `${number}px`} value
   * @param {number} length
   * @param {number} fallback
   */
  function toPixels(value, length, fallback) {
    if (typeof value === "string") {
      const pixels = Number.parseFloat(value);
      return length ? Math.round(clamp(pixels, 0, length)) : pixels;
    }
    return length
      ? Math.round(clamp((value / 100) * length, 0, length))
      : fallback;
  }

  /**
   * @param {number | `${number}px`} value
   * @param {boolean} pixels
   * @param {number} length
   * @param {number} fallback
   */
  function toUnit(value, pixels, length, fallback) {
    return pixels
      ? toPixels(value, length, fallback)
      : toPercent(value, length, fallback);
  }

  /** @param {number | `${number}px`} value */
  function sizeValue(value) {
    return typeof value === "string" ? Number.parseFloat(value) : value;
  }

  // A size written back through `bind:size` or `resize` keeps the unit it
  // was given in. Drag math yields long fractions: pixels round to whole
  // pixels, and percentages to two decimals, which is finer than a pixel
  // on any realistic splitter and keeps `aria-valuenow` readable.
  /**
   * @param {number} value
   * @returns {Size}
   */
  function withUnit(value) {
    return /** @type {Size} */ (
      pixelSize ? `${Math.round(value)}px` : Math.round(value * 100) / 100
    );
  }

  // Below `min`, a size renders at `min`, and at `collapsedBound` once it
  // reaches it. A drag or arrow key also snaps to `collapsedBound` past
  // halfway between the two, so a `size` set from outside, or a splitter
  // that narrows, never collapses a pane the user left open. Without
  // `collapsedSize` the two match, and this is a plain clamp.
  // Reactive statements pass the bounds so Svelte sees them as dependencies.
  /**
   * @param {number} value
   * @param {number} [lower]
   * @param {number} [upper]
   * @param {number} [collapsedTo]
   * @param {boolean} [snap]
   * @returns {number}
   */
  function constrain(
    value,
    lower = minBound,
    upper = maxBound,
    collapsedTo = collapsedBound,
    snap = false,
  ) {
    const snapAt = snap ? (collapsedTo + lower) / 2 : collapsedTo;
    if (value < lower && value <= snapAt) return collapsedTo;
    return clamp(value, lower, upper);
  }

  /**
   * @param {number} next
   * @param {boolean} [snap]
   */
  function setSize(next, snap = false) {
    size = withUnit(constrain(next, minBound, maxBound, collapsedBound, snap));
  }

  // `bind:size` updates on every step of a drag; `resize` fires once per
  // gesture, for example to persist the final size.
  /** @param {number} prevSize */
  function dispatchResize(prevSize) {
    const nextSize = constrain(sizeValue(size));
    if (nextSize === prevSize) return;
    // Whatever collapsed it (Enter, Home, a drag), restoring goes back to
    // where the gesture started.
    if (nextSize <= collapsedBound && prevSize > collapsedBound) {
      expandedSize = withUnit(prevSize);
    }
    dispatch("resize", { size: withUnit(nextSize) });
  }

  function restoreSize() {
    const expanded = toUnit(
      expandedSize,
      pixelSize,
      containerLength,
      collapsedBound,
    );
    if (expanded > collapsedBound) return expanded;
    // Before the splitter is measured, a pixel size has no middle of a
    // percentage range to go to.
    return Number.isFinite(maxBound) ? (minBound + maxBound) / 2 : minBound;
  }

  /**
   * @param {boolean} nextCollapsed
   * @param {number} currentSize
   */
  function syncCollapsed(nextCollapsed, currentSize) {
    if (nextCollapsed !== syncedCollapsed) {
      syncedCollapsed = nextCollapsed;
      if (nextCollapsed && currentSize > collapsedBound) {
        expandedSize = withUnit(currentSize);
        setSize(collapsedBound);
      } else if (!nextCollapsed && currentSize <= collapsedBound) {
        setSize(restoreSize());
      }
      return;
    }
    const atCollapsed = currentSize <= collapsedBound;
    if (atCollapsed !== collapsed) collapsed = syncedCollapsed = atCollapsed;
  }

  /** @param {PointerEvent} event */
  function getPointerAxis(event) {
    const rect = /** @type {HTMLDivElement} */ (ref).getBoundingClientRect();
    return orientation === "vertical"
      ? { point: event.clientY, length: rect.height }
      : { point: event.clientX, length: rect.width };
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    if (disabled || !measured) return false;
    // The press focuses the separator natively, which, unlike a scripted
    // focus(), doesn't count as `:focus-visible` and draw the ring.
    resizing = true;
    // In RTL the start pane is on the right, so dragging left grows it.
    dragDirection =
      orientation !== "vertical" &&
      resolveLayoutDirection($layoutDirection, ref) === "rtl"
        ? -1
        : 1;
    dragStartPoint = getPointerAxis(event).point;
    dragStartSize = renderedSize;
  }

  /** @param {PointerEvent} event */
  function handleDragMove(event) {
    const { point, length } = getPointerAxis(event);
    if (!length) return;
    const moved = dragDirection * (point - dragStartPoint);
    setSize(dragStartSize + (pixelSize ? moved : (moved / length) * 100), true);
  }

  function handleDragEnd() {
    resizing = false;
    dispatchResize(dragStartSize);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // Alt/Ctrl/Meta+Arrow belong to the browser (Alt/Cmd+Left is Back).
    if (disabled || !measured || hasModifierKey(event)) return;
    const distance =
      step *
      (event.shiftKey ? LARGE_STEP_MULTIPLIER : 1) *
      (pixelSize ? containerLength / 100 : 1);
    const vertical = orientation === "vertical";
    // ArrowRight moves the separator toward the inline end, growing the
    // start pane.
    const key = inlineKey(event.key, $layoutDirection, ref);
    let next;
    if (key === (vertical ? "ArrowUp" : "ArrowLeft")) {
      next = renderedSize - distance;
    } else if (key === (vertical ? "ArrowDown" : "ArrowRight")) {
      next = renderedSize + distance;
    } else if (event.key === "Home") {
      next = minBound;
    } else if (event.key === "End") {
      next = maxBound;
    } else if (event.key === "Enter") {
      // Collapse the start pane, or restore it if already collapsed.
      next = renderedSize > collapsedBound ? collapsedBound : restoreSize();
    } else {
      return;
    }
    event.preventDefault();
    const prevSize = renderedSize;
    setSize(next, true);
    dispatchResize(prevSize);
  }

  function handleDblclick() {
    if (disabled) return;
    const prevSize = renderedSize;
    setSize(toUnit(initialSize, pixelSize, containerLength, renderedSize));
    dispatchResize(prevSize);
  }

  // The sizes and bounds below are in `size`'s unit: pixels for a pixel
  // length, otherwise percentages.
  $: pixelSize = typeof size === "string";
  $: unit = pixelSize ? "px" : "%";
  // Bounds in pixels, and with a pixel `size` percentages too, also go on
  // the start pane, where they hold before the splitter is measured and
  // on the server. A percentage there resolves against the splitter.
  $: minLength =
    typeof min === "string"
      ? min
      : pixelSize && min > 0
        ? `${min}%`
        : undefined;
  $: maxLength =
    typeof max === "string" ? max : pixelSize ? `${max}%` : undefined;
  $: observeContainer(
    ref,
    [size, min, max, collapsedSize].some((value) => typeof value === "string"),
  );
  $: vertical = orientation === "vertical";
  $: containerLength = vertical ? containerSize.height : containerSize.width;
  // Keys and drags wait for the measurement a pixel size needs to convert
  // percentages: `step`, and `min` or `max` for Home and End.
  $: measured = !pixelSize || containerLength > 0;
  $: minBound = toUnit(min, pixelSize, containerLength, 0);
  // As with CSS min/max sizes, a `min` larger than `max` wins.
  $: maxBound = Math.max(
    toUnit(max, pixelSize, containerLength, pixelSize ? Infinity : 100),
    minBound,
  );
  $: collapsedBound =
    collapsedSize === undefined
      ? minBound
      : Math.min(
          toUnit(collapsedSize, pixelSize, containerLength, 0),
          minBound,
        );
  // Before `renderedSize`, so a size this sets renders in the same update.
  $: syncCollapsed(
    collapsed,
    constrain(sizeValue(size), minBound, maxBound, collapsedBound),
  );
  $: renderedSize = constrain(
    sizeValue(size),
    minBound,
    maxBound,
    collapsedBound,
  );
  // The pane's inline `min` mustn't hold it open once it collapses below.
  $: belowMin = renderedSize < minBound;
  // The separator's value stays a percentage, as ARIA defines it. A pixel
  // size has none until the splitter is measured, so the server and the
  // first client render leave `aria-valuenow` out rather than guess.
  $: valueNow = pixelSize
    ? containerLength
      ? pixelsToPercent(renderedSize, containerLength, 0)
      : undefined
    : renderedSize;
  $: valueMin = pixelSize
    ? pixelsToPercent(collapsedBound, containerLength, 0)
    : collapsedBound;
  $: valueMax = pixelSize
    ? pixelsToPercent(maxBound, containerLength, 100)
    : maxBound;
  $: endFilled = pixelSize
    ? containerLength > 0 && renderedSize >= containerLength
    : renderedSize === 100;
  // Rest props go on the root, but naming and description belong on the
  // separator, the element that takes focus.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));

  $: resolvedEnterDelayMs =
    enterDelayMs ?? parent?.enterDelayMs() ?? SEPARATOR_HOVER_DELAY_MS;
  $: if (disabled) {
    scheduleHover.cancel();
    hovered = false;
  }

  // Touch has no hover, and a pen or mouse pass over the separator
  // shouldn't flash it.
  /** @param {PointerEvent} event */
  function handlePointerenter(event) {
    if (disabled || event.pointerType === "touch") return;
    scheduleHover(resolvedEnterDelayMs, () => {
      hovered = true;
    });
  }

  function handlePointerleave() {
    scheduleHover.cancel();
    hovered = false;
  }

  onMount(() => () => {
    scheduleHover.cancel();
    stopObserving();
  });
</script>

<div
  bind:this={ref}
  {id}
  class:bx--splitter={true}
  class:bx--splitter--vertical={orientation === "vertical"}
  class:bx--splitter--resizing={resizing}
  {...rest}
>
  <!-- A pane shrunk to nothing is `inert`, so its content leaves the tab order. -->
  <div
    id="{id}-start"
    class:bx--splitter__pane={true}
    class:bx--splitter__pane--start={true}
    style:flex-basis="{renderedSize}{unit}"
    style:min-width={vertical || belowMin ? undefined : minLength}
    style:max-width={vertical ? undefined : maxLength}
    style:min-height={vertical && !belowMin ? minLength : undefined}
    style:max-height={vertical ? maxLength : undefined}
    inert={renderedSize === 0 || undefined}
  >
    <slot name="start" />
  </div>
  <!-- A focusable separator is an interactive widget (WAI-ARIA window splitter). -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    role="separator"
    tabindex={disabled ? undefined : 0}
    aria-label={ariaLabel ?? separatorLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    aria-orientation={orientation === "vertical" ? "horizontal" : "vertical"}
    aria-controls="{id}-start"
    aria-valuenow={disabled ? undefined : valueNow}
    aria-valuemin={disabled ? undefined : valueMin}
    aria-valuemax={disabled ? undefined : valueMax}
    class:bx--splitter__separator={true}
    class:bx--splitter__separator--disabled={disabled}
    class:bx--splitter__separator--hover={hovered}
    use:pointerDrag={{
      enabled: !disabled,
      onStart: handleDragStart,
      onMove: handleDragMove,
      onEnd: handleDragEnd,
    }}
    on:keydown={handleKeydown}
    on:dblclick={handleDblclick}
    on:pointerenter={handlePointerenter}
    on:pointerleave={handlePointerleave}
  ></div>
  <div
    class:bx--splitter__pane={true}
    class:bx--splitter__pane--end={true}
    inert={endFilled || undefined}
  >
    <slot name="end" />
  </div>
</div>
