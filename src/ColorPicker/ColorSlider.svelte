<script>
  /**
   * The hue and alpha sliders of `ColorPicker`.
   * @event {number} input
   * @event {number} change
   * @event {null} commit
   */

  /**
   * Specify which channel the track paints.
   * @type {"hue" | "alpha"}
   */
  export let channel = "hue";

  /** Specify the value */
  export let value = 0;

  /** Set the maximum value */
  export let max = 100;

  /** Specify the accessible name of the thumb */
  export let label = "";

  /** Specify the text a screen reader reads for the value */
  export let valueText = "";

  /**
   * Specify the id of an element that describes the thumb.
   * @type {string | undefined}
   */
  export let describedBy = undefined;

  /** Set to `true` to disable the slider */
  export let disabled = false;

  /**
   * Set to `true` to keep the value while the thumb stays focusable. Keys
   * and drags change nothing.
   */
  export let readonly = false;

  /**
   * Obtain a reference to the thumb.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { getLayoutDirection } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import {
    isTrackRtl,
    snapToStep,
    trackLeft,
    trackSign,
  } from "../utils/slider-value.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let trackRef = null;
  let rtl = false;
  let dirty = false;
  let rect = { left: 0, right: 1, width: 1 };

  /**
   * @param {"ltr" | "rtl" | undefined} contextDirection
   * @param {Element | null} track
   */
  function syncDirection(contextDirection, track) {
    rtl = isTrackRtl("horizontal", contextDirection, track);
  }

  function readDirection() {
    syncDirection($layoutDirection, trackRef);
  }

  $: syncDirection($layoutDirection, trackRef);
  $: percent = max === 0 ? 0 : (value / max) * 100;

  /** @param {number} next */
  function emit(next, type = "input") {
    dispatch(type, snapToStep(next, { min: 0, max, step: 1 }));
  }

  /** @param {PointerEvent} event */
  function moveTo(event) {
    const x = rtl
      ? (rect.right - event.clientX) / rect.width
      : (event.clientX - rect.left) / rect.width;
    emit(x * max);
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    if (disabled || readonly || !trackRef) return false;
    readDirection();
    event.preventDefault();
    ref?.focus({ preventScroll: true });
    const box = trackRef.getBoundingClientRect();
    rect = { left: box.left, right: box.right, width: box.width || 1 };
    moveTo(event);
  }

  function handleDragEnd() {
    emit(value, "change");
    dispatch("commit");
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (disabled || readonly || hasModifierKey(event)) return;
    const big = event.shiftKey ? 10 : 1;
    let next = value;
    switch (event.key) {
      case "ArrowLeft":
        next += rtl ? big : -big;
        break;
      case "ArrowRight":
        next += rtl ? -big : big;
        break;
      case "ArrowDown":
        next -= big;
        break;
      case "ArrowUp":
        next += big;
        break;
      case "PageDown":
        next -= 10;
        break;
      case "PageUp":
        next += 10;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    dirty = true;
    emit(next);
    emit(next, "change");
  }

  function handleBlur() {
    if (!dirty) return;
    dirty = false;
    dispatch("commit");
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={trackRef}
  class:bx--color-picker__slider={true}
  class:bx--color-picker__slider--hue={channel === "hue"}
  class:bx--color-picker__slider--alpha={channel === "alpha"}
  class:bx--color-picker__slider--disabled={disabled}
  class:bx--color-picker__slider--readonly={readonly}
  style:--ccs-slider-sign={trackSign(rtl)}
  style:--ccs-color-picker-hue={channel === "hue" ? value : undefined}
  use:pointerDrag={{
    enabled: !disabled && !readonly,
    onStart: handleDragStart,
    onMove: moveTo,
    onEnd: handleDragEnd,
  }}
  on:pointerenter={readDirection}
>
  <div
    bind:this={ref}
    role="slider"
    tabindex={disabled ? undefined : 0}
    class:bx--color-picker__thumb={true}
    style:left={trackLeft(percent)}
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={Math.round(value)}
    aria-valuetext={valueText || undefined}
    aria-orientation="horizontal"
    aria-describedby={describedBy}
    aria-disabled={disabled || undefined}
    aria-readonly={readonly || undefined}
    on:focus={readDirection}
    on:keydown={handleKeydown}
    on:blur={handleBlur}
  ></div>
</div>
