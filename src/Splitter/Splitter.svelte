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

  /** Set the minimum size of the start pane, as a percentage */
  export let min = 0;

  /** Set the maximum size of the start pane, as a percentage */
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
   * Obtain a reference to the root element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { clamp } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { uniqueId } from "../utils/unique-id.js";

  const LARGE_STEP_MULTIPLIER = 10;

  const dispatch = createEventDispatcher();

  const startPaneId = uniqueId();
  // Double-clicking the separator restores the size the splitter started at.
  const initialSize = size;

  let separatorRef = null;
  let resizing = false;
  let dragStartPoint = 0;
  let dragStartSize = 0;
  // Size that Enter restores after collapsing the start pane to `min`.
  let expandedSize = size;

  // Drag math yields long fractions; two decimals is finer than a pixel on
  // any realistic splitter and keeps `aria-valuenow` readable.
  function setSize(next) {
    size = Math.round(clamp(next, min, max) * 100) / 100;
  }

  // `bind:size` updates on every step of a drag; `resize` fires once per
  // gesture, for example to persist the final size.
  function dispatchResize(prevSize) {
    const nextSize = clamp(size, min, max);
    if (nextSize !== prevSize) dispatch("resize", { size: nextSize });
  }

  function getPointerAxis(event) {
    const rect = ref.getBoundingClientRect();
    return orientation === "vertical"
      ? { point: event.clientY, length: rect.height }
      : { point: event.clientX, length: rect.width };
  }

  function handleDragStart(event) {
    if (disabled) return false;
    // Keep the press from starting a text selection, and focus the
    // separator ourselves since that cancels the default focus too.
    event.preventDefault();
    separatorRef?.focus({ preventScroll: true });
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
    if (disabled) return;
    const distance = step * (event.shiftKey ? LARGE_STEP_MULTIPLIER : 1);
    const vertical = orientation === "vertical";
    let next;
    if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) {
      next = renderedSize - distance;
    } else if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) {
      next = renderedSize + distance;
    } else if (event.key === "Home") {
      next = min;
    } else if (event.key === "End") {
      next = max;
    } else if (event.key === "Enter") {
      // Collapse the start pane, or restore it if already collapsed.
      if (renderedSize > min) {
        expandedSize = renderedSize;
        next = min;
      } else {
        next = expandedSize;
      }
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

  $: renderedSize = clamp(size, min, max);
</script>

<div
  bind:this={ref}
  class:bx--splitter={true}
  class:bx--splitter--vertical={orientation === "vertical"}
  class:bx--splitter--resizing={resizing}
  {...$$restProps}
>
  <div
    id={startPaneId}
    class:bx--splitter__pane={true}
    class:bx--splitter__pane--start={true}
    style:flex-basis="{renderedSize}%"
  >
    <slot name="start" />
  </div>
  <!-- A focusable separator is an interactive widget (WAI-ARIA window splitter). -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    bind:this={separatorRef}
    role="separator"
    tabindex={disabled ? undefined : 0}
    aria-label={separatorLabel}
    aria-orientation={orientation === "vertical" ? "horizontal" : "vertical"}
    aria-controls={startPaneId}
    aria-valuenow={disabled ? undefined : renderedSize}
    aria-valuemin={disabled ? undefined : min}
    aria-valuemax={disabled ? undefined : max}
    class:bx--splitter__separator={true}
    class:bx--splitter__separator--disabled={disabled}
    use:pointerDrag={{
      enabled: !disabled,
      onStart: handleDragStart,
      onMove: handleDragMove,
      onEnd: handleDragEnd,
    }}
    on:keydown={handleKeydown}
    on:dblclick={handleDblclick}
  ></div>
  <div class:bx--splitter__pane={true} class:bx--splitter__pane--end={true}>
    <slot name="end" />
  </div>
</div>
