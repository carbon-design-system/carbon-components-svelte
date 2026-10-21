<script>
  /**
   * @restProps {div}
   * @slot {{}} start - Content of the start pane, sized by `size`.
   * @slot {{}} end - Content of the end pane, which fills the remaining space.
   * @event {{ size: number }} resize - Fires once the user finishes resizing (drag release, key press, or double click) and the size changed.
   */

  /**
   * Specify the size of the start pane as a percentage of the splitter.
   * Rendered clamped to `[min, max]`.
   * @bindable writable
   */
  export let size = 50;

  /**
   * Set to `true` to collapse the start pane to `min`, and back to `false`
   * to restore the size it had before. Moving the separator to `min` by
   * any means also sets it to `true`.
   * @bindable writable
   */
  export let collapsed = false;

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
   * Set the percentage an arrow key moves the separator.
   * Shift + arrow key moves 10 times as far.
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
   */
  export let ref = null;

  /**
   * Set an id for the top-level element.
   * The start pane id derives from it as `{id}-start`.
   */
  export let id = uniqueId();

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
  import { noop } from "../utils/noop.js";
  import { clamp } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";

  const LARGE_STEP_MULTIPLIER = 10;

  const dispatch = createEventDispatcher();

  /** @type {undefined | { enterDelayMs: () => number }} */
  const parent = getContext("carbon:Splitter");

  // Nested splitters without their own delay use this one's.
  setContext("carbon:Splitter", { enterDelayMs: () => resolvedEnterDelayMs });

  const scheduleHover = createDelayedSetter();
  // Set once the pointer has rested on the separator for the enter delay.
  let hovered = false;

  // Double-clicking the separator restores the size the splitter started at.
  const initialSize = size;

  let resizing = false;
  let dragStartPoint = 0;
  let dragStartSize = 0;
  // Size that Enter or `collapsed = false` restores after the start pane
  // reaches `min`.
  let expandedSize = size;
  // The `collapsed` value last matched to the size; a difference means the
  // prop was set from outside. Starts `false` so `collapsed={true}` on
  // mount collapses the pane.
  let syncedCollapsed = false;

  // The splitter's size, measured only while `min` or `max` is in pixels.
  let containerSize = { width: 0, height: 0 };
  let stopObserving = noop;

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
  function toPercent(bound, length, fallback) {
    if (typeof bound === "number") return bound;
    if (!length) return fallback;
    const percent = (Number.parseFloat(bound) / length) * 100;
    return Math.round(clamp(percent, 0, 100) * 100) / 100;
  }

  // Drag math yields long fractions; two decimals is finer than a pixel on
  // any realistic splitter and keeps `aria-valuenow` readable.
  function setSize(next) {
    size = Math.round(clamp(next, minPercent, maxPercent) * 100) / 100;
  }

  // `bind:size` updates on every step of a drag; `resize` fires once per
  // gesture, for example to persist the final size.
  function dispatchResize(prevSize) {
    const nextSize = clamp(size, minPercent, maxPercent);
    if (nextSize === prevSize) return;
    // Whatever moved it to `min` (Enter, Home, a drag), restoring goes back
    // to where the gesture started.
    if (nextSize <= minPercent && prevSize > minPercent)
      expandedSize = prevSize;
    dispatch("resize", { size: nextSize });
  }

  function restoreSize() {
    return expandedSize > minPercent
      ? expandedSize
      : (minPercent + maxPercent) / 2;
  }

  function syncCollapsed(nextCollapsed, currentSize) {
    if (nextCollapsed !== syncedCollapsed) {
      syncedCollapsed = nextCollapsed;
      if (nextCollapsed && currentSize > minPercent) {
        expandedSize = currentSize;
        setSize(minPercent);
      } else if (!nextCollapsed && currentSize <= minPercent) {
        setSize(restoreSize());
      }
      return;
    }
    const atMin = currentSize <= minPercent;
    if (atMin !== collapsed) collapsed = syncedCollapsed = atMin;
  }

  function getPointerAxis(event) {
    const rect = ref.getBoundingClientRect();
    return orientation === "vertical"
      ? { point: event.clientY, length: rect.height }
      : { point: event.clientX, length: rect.width };
  }

  function handleDragStart(event) {
    if (disabled) return false;
    // The press focuses the separator natively, which, unlike a scripted
    // focus(), doesn't count as `:focus-visible` and draw the ring.
    resizing = true;
    dragStartPoint = getPointerAxis(event).point;
    dragStartSize = renderedSize;
  }

  function handleDragMove(event) {
    const { point, length } = getPointerAxis(event);
    if (!length) return;
    setSize(dragStartSize + ((point - dragStartPoint) / length) * 100);
  }

  function handleDragEnd() {
    resizing = false;
    dispatchResize(dragStartSize);
  }

  function handleKeydown(event) {
    // Alt/Ctrl/Meta+Arrow belong to the browser (Alt/Cmd+Left is Back).
    if (disabled || hasModifierKey(event)) return;
    const distance = step * (event.shiftKey ? LARGE_STEP_MULTIPLIER : 1);
    const vertical = orientation === "vertical";
    let next;
    if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) {
      next = renderedSize - distance;
    } else if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) {
      next = renderedSize + distance;
    } else if (event.key === "Home") {
      next = minPercent;
    } else if (event.key === "End") {
      next = maxPercent;
    } else if (event.key === "Enter") {
      // Collapse the start pane, or restore it if already collapsed.
      next = renderedSize > minPercent ? minPercent : restoreSize();
    } else {
      return;
    }
    event.preventDefault();
    const prevSize = renderedSize;
    setSize(next);
    dispatchResize(prevSize);
  }

  function handleDblclick() {
    if (disabled) return;
    const prevSize = renderedSize;
    setSize(initialSize);
    dispatchResize(prevSize);
  }

  // Pixel bounds also go on the start pane, where they hold before the
  // splitter is measured.
  $: minLength = typeof min === "string" ? min : undefined;
  $: maxLength = typeof max === "string" ? max : undefined;
  $: observeContainer(ref, minLength !== undefined || maxLength !== undefined);
  $: vertical = orientation === "vertical";
  $: containerLength = vertical ? containerSize.height : containerSize.width;
  $: minPercent = toPercent(min, containerLength, 0);
  // As with CSS min/max sizes, a `min` larger than `max` wins.
  $: maxPercent = Math.max(toPercent(max, containerLength, 100), minPercent);
  // Before `renderedSize`, so a size this sets renders in the same update.
  $: syncCollapsed(collapsed, clamp(size, minPercent, maxPercent));
  $: renderedSize = clamp(size, minPercent, maxPercent);
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
    style:flex-basis="{renderedSize}%"
    style:min-width={vertical ? undefined : minLength}
    style:max-width={vertical ? undefined : maxLength}
    style:min-height={vertical ? minLength : undefined}
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
    aria-valuenow={disabled ? undefined : renderedSize}
    aria-valuemin={disabled ? undefined : minPercent}
    aria-valuemax={disabled ? undefined : maxPercent}
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
    inert={renderedSize === 100 || undefined}
  >
    <slot name="end" />
  </div>
</div>
