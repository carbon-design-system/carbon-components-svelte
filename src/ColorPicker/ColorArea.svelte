<script>
  /**
   * The saturation and brightness area of `ColorPicker`.
   * @event {{ saturation: number; brightness: number }} input
   * @event {{ saturation: number; brightness: number }} change
   * @event {null} commit
   */

  /** Specify the hue in degrees, which paints the area */
  export let hue = 0;

  /** Specify the saturation from 0 to 100, along the inline axis */
  export let saturation = 0;

  /** Specify the brightness from 0 to 100, from the bottom edge up */
  export let brightness = 0;

  /** Specify the accessible name of the thumb */
  export let label = "";

  /** Specify the role description of the thumb, such as `"2D slider"` */
  export let roleDescription = "";

  /** Specify the text a screen reader reads for the thumb's position */
  export let valueText = "";

  /**
   * Specify the id of an element that describes the thumb.
   * @type {string | undefined}
   */
  export let describedBy = undefined;

  /** Set to `true` to disable the area */
  export let disabled = false;

  /**
   * Set to `true` to keep the value while the thumb stays focusable. Keys
   * and drags change nothing.
   */
  export let readonly = false;

  /**
   * Obtain a reference to the thumb, which takes focus.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { getLayoutDirection } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { isTrackRtl, trackLeft, trackSign } from "../utils/slider-value.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let areaRef = null;
  let rtl = false;
  let dirty = false;
  // Measured when a drag starts, so a move reads no layout.
  let rect = { left: 0, top: 0, width: 1, height: 1, right: 1 };

  /**
   * @param {"ltr" | "rtl" | undefined} contextDirection
   * @param {Element | null} track
   */
  function syncDirection(contextDirection, track) {
    rtl = isTrackRtl("horizontal", contextDirection, track);
  }

  function readDirection() {
    syncDirection($layoutDirection, areaRef);
  }

  $: syncDirection($layoutDirection, areaRef);

  /** @param {number} value */
  function clamp(value) {
    return Math.min(100, Math.max(0, value));
  }

  /**
   * @param {number} nextSaturation
   * @param {number} nextBrightness
   * @param {"input" | "change"} type
   */
  function emit(nextSaturation, nextBrightness, type) {
    dispatch(type, {
      saturation: clamp(nextSaturation),
      brightness: clamp(nextBrightness),
    });
  }

  /** @param {PointerEvent} event */
  function moveTo(event) {
    const x = rtl
      ? (rect.right - event.clientX) / rect.width
      : (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    emit(x * 100, 100 - y * 100, "input");
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    if (disabled || readonly || !areaRef) return false;
    readDirection();
    // Focus the thumb so the arrow keys work after a press on the area.
    // The compat `mousedown` would otherwise move focus to the body.
    event.preventDefault();
    ref?.focus({ preventScroll: true });
    const box = areaRef.getBoundingClientRect();
    rect = {
      left: box.left,
      top: box.top,
      right: box.right,
      width: box.width || 1,
      height: box.height || 1,
    };
    moveTo(event);
  }

  function handleDragEnd() {
    emit(saturation, brightness, "change");
    dispatch("commit");
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (disabled || readonly || hasModifierKey(event)) return;
    const big = event.shiftKey ? 10 : 1;
    let nextSaturation = saturation;
    let nextBrightness = brightness;
    switch (event.key) {
      case "ArrowLeft":
        nextSaturation += rtl ? big : -big;
        break;
      case "ArrowRight":
        nextSaturation += rtl ? -big : big;
        break;
      case "ArrowUp":
        nextBrightness += big;
        break;
      case "ArrowDown":
        nextBrightness -= big;
        break;
      case "PageUp":
        nextBrightness += 10;
        break;
      case "PageDown":
        nextBrightness -= 10;
        break;
      case "Home":
        nextSaturation = 0;
        break;
      case "End":
        nextSaturation = 100;
        break;
      default:
        return;
    }
    // Keep the arrow and page keys from also scrolling the page.
    event.preventDefault();
    dirty = true;
    emit(nextSaturation, nextBrightness, "input");
    emit(nextSaturation, nextBrightness, "change");
  }

  function handleBlur() {
    if (!dirty) return;
    dirty = false;
    dispatch("commit");
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={areaRef}
  class:bx--color-picker__area={true}
  class:bx--color-picker__area--disabled={disabled}
  class:bx--color-picker__area--readonly={readonly}
  style:--ccs-color-picker-hue={hue}
  style:--ccs-slider-sign={trackSign(rtl)}
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
    style:left={trackLeft(saturation)}
    style:top="{100 - brightness}%"
    aria-label={label}
    aria-roledescription={roleDescription || undefined}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(saturation)}
    aria-valuetext={valueText}
    aria-describedby={describedBy}
    aria-disabled={disabled || undefined}
    aria-readonly={readonly || undefined}
    on:focus={readDirection}
    on:keydown={handleKeydown}
    on:blur={handleBlur}
  ></div>
</div>
