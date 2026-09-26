<script>
  /**
   * @event {{ value: number; valueUpper: number }} change
   * @event {{ value: number; valueUpper: number }} input
   * @event {{ value: number; valueUpper: number; handle: "lower" | "upper" }} focus
   * @event {{ value: number; valueUpper: number; handle: "lower" | "upper" }} blur
   */

  /**
   * Specify the lower bound value of the slider.
   * Kept when the owning form resets.
   * @bindable writable
   */
  export let value = 0;

  /**
   * Specify the upper bound value of the slider.
   * Kept when the owning form resets.
   * @bindable writable
   */
  export let valueUpper = 100;

  /** Set the maximum slider value */
  export let max = 100;

  /** Specify the label for the max value */
  export let maxLabel = "";

  /** Set the minimum slider value */
  export let min = 0;

  /** Specify the label for the min value */
  export let minLabel = "";

  /**
   * Format displayed values for range labels and `aria-valuetext`.
   * Does not change the numeric model; the text inputs stay numeric.
   * @type {undefined | ((value: number) => string)}
   */
  export let formatValue = undefined;

  /** Set the step value */
  export let step = 1;

  /**
   * Show tick marks along the track.
   * Set to `true` to place a tick at every `step`, or pass an array of
   * `{ value, label? }` for specific stops with optional labels below the track.
   * Marks are visual only; snapping still follows `step`.
   * @type {boolean | ReadonlyArray<{ value: number; label?: string }>}
   */
  export let marks = false;

  /** Set the step multiplier value */
  export let stepMultiplier = 4;

  /** Set the minimum allowed distance between `value` and `valueUpper` */
  export let minGap = 0;

  /** Set to `true` to require a value */
  export let required = false;

  /** Specify the input type */
  export let inputType = "number";

  /** Set to `true` to disable the slider */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to hide the text inputs */
  export let hideTextInput = false;

  /**
   * Set to `true` for the slider to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  /**
   * Set to "vertical" to lay out the slider along the vertical axis
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /** Set an id for the slider div element */
  export let id = uniqueId();

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Specify the label text.
   * Alternatively, use the "labelChildren" slot.
   * @example
   * ```svelte
   * <RangeSlider>
   *   <span slot="labelChildren">Custom Label</span>
   * </RangeSlider>
   * ```
   */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set a name for the lower bound input element */
  export let name = "";

  /** Set a name for the upper bound input element */
  export let nameUpper = "";

  /** Specify the `aria-label` for the lower bound input and handle */
  export let ariaLabelInput = "Lower bound";

  /** Specify the `aria-label` for the upper bound input and handle */
  export let ariaLabelInputUpper = "Upper bound";

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select a text input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { createEventDispatcher, tick } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { clamp } from "../utils/numeric-format.js";
  import { reflectDefaultValue } from "../utils/reflect-default-value.js";
  import { resolveSliderMarks } from "../utils/resolve-slider-marks.js";
  import {
    formatRangeLabel as formatSliderRangeLabel,
    getClientX,
    getClientY,
    getValueText as getSliderValueText,
    valueFromTrackPosition,
  } from "../utils/slider-value.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** @typedef {{ value: number; valueUpper: number }} RangeSliderChangeDetail */
  /** @typedef {"lower" | "upper"} ActiveHandle */
  /** @typedef {RangeSliderChangeDetail & { handle: ActiveHandle }} RangeSliderFocusDetail */
  /** @typedef {MouseEvent | TouchEvent} PointerLikeEvent */

  /** @type {(type: "change" | "input" | "focus" | "blur", detail: RangeSliderChangeDetail | RangeSliderFocusDetail) => void} */
  const dispatch = createEventDispatcher();

  /** @type {HTMLDivElement | null} */
  let trackRef = null;
  /** @type {HTMLDivElement | null} */
  let lowerThumbRef = null;
  /** @type {HTMLDivElement | null} */
  let upperThumbRef = null;
  /** @type {HTMLInputElement | null} */
  let lowerInputRef = null;
  /** @type {HTMLInputElement | null} */
  let upperInputRef = null;
  /** @type {ActiveHandle} */
  let activeHandle = "lower";
  let dragging = false;
  let holding = false;
  /** @type {PointerLikeEvent | null} */
  let currentEvent = null;
  // Pointer distance from the active handle's value point when the press
  // started on the handle itself, so grabbing a handle doesn't jump it.
  let grabOffset = 0;

  /** @type {(label: string, numericValue: number) => string | number} */
  function formatRangeLabel(label, numericValue) {
    return formatSliderRangeLabel(label, numericValue, formatValue);
  }

  /** @type {(numericValue: number) => string | undefined} */
  function getValueText(numericValue) {
    return getSliderValueText(numericValue, formatValue);
  }

  /** @type {(e: PointerLikeEvent) => number | null} */
  function getPointerPosition(event) {
    return orientation === "vertical" ? getClientY(event) : getClientX(event);
  }

  /**
   * Track start and signed length along the slider axis. Values increase
   * upward when vertical, so the start is the bottom edge and the length is
   * negative.
   * @type {() => { start: number; length: number }}
   */
  function getTrackAxis() {
    const rect = trackRef.getBoundingClientRect();
    return orientation === "vertical"
      ? { start: rect.bottom, length: -rect.height }
      : { start: rect.left, length: rect.width };
  }

  /** @type {(e: PointerLikeEvent) => ActiveHandle} */
  function pickHandle(event) {
    const target = /** @type {Node | null} */ (event.target);
    if (target && lowerThumbRef?.contains(target)) return "lower";
    if (target && upperThumbRef?.contains(target)) return "upper";
    const vertical = orientation === "vertical";
    const point = getPointerPosition(event);
    if (point == null) return activeHandle;
    /** @type {(rect: DOMRect | undefined) => number} */
    const distance = (rect) => {
      if (!rect) return Number.POSITIVE_INFINITY;
      const center = vertical
        ? rect.top + rect.height / 2
        : rect.left + rect.width / 2;
      return Math.abs(center - point);
    };
    const dLower = distance(lowerThumbRef?.getBoundingClientRect());
    const dUpper = distance(upperThumbRef?.getBoundingClientRect());
    return dLower <= dUpper ? "lower" : "upper";
  }

  function handleLowerInputFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => lowerInputRef?.select());
    }
    dispatch("focus", { value, valueUpper, handle: "lower" });
  }

  function handleLowerInputBlur() {
    dispatch("blur", { value, valueUpper, handle: "lower" });
  }

  function handleUpperInputFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => upperInputRef?.select());
    }
    dispatch("focus", { value, valueUpper, handle: "upper" });
  }

  function handleUpperInputBlur() {
    dispatch("blur", { value, valueUpper, handle: "upper" });
  }

  /** @type {(e: MouseEvent | TouchEvent) => void} */
  function startInteraction(event) {
    if (disabled || readonly) return;
    activeHandle = pickHandle(event);
    const thumbRef = activeHandle === "lower" ? lowerThumbRef : upperThumbRef;
    thumbRef?.focus({ preventScroll: true });

    grabOffset = 0;
    const target = /** @type {Node | null} */ (event.target);
    const point = getPointerPosition(event);
    if (trackRef && point != null && target && thumbRef?.contains(target)) {
      const { start, length } = getTrackAxis();
      const percent = activeHandle === "lower" ? left : leftUpper;
      grabOffset = point - (start + (length * percent) / 100);
    }
    currentEvent = event;
    holding = true;
    dragging = true;
  }

  /** @type {() => void} */
  function stopHolding() {
    const wasHolding = holding;
    holding = false;
    dragging = false;
    currentEvent = null;
    grabOffset = 0;
    if (wasHolding && !disabled && !readonly) {
      dispatch("change", { value, valueUpper });
    }
  }

  /** @type {(e: PointerLikeEvent) => void} */
  function move(event) {
    if (holding) {
      currentEvent = event;
      dragging = true;
    }
  }

  /** @type {(e: PointerLikeEvent | null) => void} */
  function calcValue(event) {
    if (disabled || readonly || !event || !trackRef) return;

    const point = getPointerPosition(event);
    if (point == null) return;
    const { start, length } = getTrackAxis();
    // valueFromTrackPosition is axis-agnostic: a negative `width` (vertical)
    // flips the interpolation so the bottom edge is `min`.
    let nextValue = valueFromTrackPosition({
      clientX: point - grabOffset,
      left: start,
      width: length,
      min,
      max,
      step,
    });

    // Apply the gap before the bounds so a large `minGap` cannot push a
    // handle outside `[min, max]` when the other handle sits near an edge.
    if (activeHandle === "lower") {
      if (nextValue > valueUpper - minGap) nextValue = valueUpper - minGap;
      if (nextValue < min) nextValue = min;
      value = nextValue;
    } else {
      if (nextValue < value + minGap) nextValue = value + minGap;
      if (nextValue > max) nextValue = max;
      valueUpper = nextValue;
    }
    dispatch("input", { value, valueUpper });
  }

  /** @type {(e: KeyboardEvent) => void} */
  function handleKeydown(event) {
    if (disabled || readonly) return;

    if (event.key === "Home" || event.key === "End") {
      // Prevent the browser from also scrolling to the top/bottom of the page.
      event.preventDefault();
      if (activeHandle === "lower") {
        value = event.key === "Home" ? min : Math.max(min, valueUpper - minGap);
      } else {
        valueUpper = event.key === "Home" ? Math.min(max, value + minGap) : max;
      }
      dispatch("input", { value, valueUpper });
      dispatch("change", { value, valueUpper });
      return;
    }

    /** @type {Record<string, number>} */
    const keys = {
      ArrowDown: -1,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -1,
      PageUp: 1,
    };
    const dir = keys[event.key];
    if (!dir) return;
    // Prevent the arrow/page keys from also scrolling the page.
    event.preventDefault();
    const range = max - min;
    const isLargeStep =
      event.shiftKey || event.key === "PageUp" || event.key === "PageDown";
    const delta =
      step * (isLargeStep ? range / step / stepMultiplier : 1) * dir;
    if (activeHandle === "lower") {
      let next = Math.round((value + delta) / step) * step;
      if (next > valueUpper - minGap) next = valueUpper - minGap;
      if (next < min) next = min;
      value = next;
    } else {
      let next = Math.round((valueUpper + delta) / step) * step;
      if (next < value + minGap) next = value + minGap;
      if (next > max) next = max;
      valueUpper = next;
    }
    dispatch("input", { value, valueUpper });
    dispatch("change", { value, valueUpper });
  }

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));

  $: labelId = `label-${id}`;
  $: ({ errorId, warnId, readonlyId, helperId } = buildFieldIds(id));
  $: lowerInputId = `lower-input-${id}`;
  $: upperInputId = `upper-input-${id}`;
  $: range = max - min;
  $: left = range === 0 ? 0 : ((value - min) / range) * 100;
  $: leftUpper = range === 0 ? 0 : ((valueUpper - min) / range) * 100;
  // Furthest each handle may travel toward the other, kept within bounds.
  $: lowerMax = Math.max(min, valueUpper - minGap);
  $: upperMin = Math.min(max, value + minGap);
  $: resolvedMarks = resolveSliderMarks(marks, min, max, step);
  $: hasMarkLabels = resolvedMarks.some(
    (mark) => mark.label != null && mark.label !== "",
  );
  $: {
    value = clamp(value, min, max);
    valueUpper = clamp(valueUpper, min, max);
    if (value > valueUpper) value = valueUpper;
    if (minGap > 0 && valueUpper - value < minGap) {
      valueUpper = Math.min(max, value + minGap);
      if (valueUpper - value < minGap)
        value = Math.max(min, valueUpper - minGap);
    }

    if (dragging && currentEvent) {
      calcValue(currentEvent);
      dragging = false;
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  use:dismiss={{
    enabled: holding,
    listeners: [
      { type: "mousemove", handler: move, options: { passive: true } },
      { type: "touchmove", handler: move, options: { passive: true } },
      { type: "mouseup", handler: stopHolding },
      { type: "touchend", handler: stopHolding },
      { type: "touchcancel", handler: stopHolding },
    ],
  }}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <label
    for={lowerInputId}
    id={labelId}
    class:bx--label={true}
    class:bx--label--disabled={disabled}
    class:bx--visually-hidden={hideLabel}
  >
    <slot name="labelChildren">{labelText}</slot>
  </label>
  <div
    class:bx--slider-container={true}
    class:bx--slider-container--two-handles={true}
    class:bx--slider-container--readonly={readonly}
    class:bx--slider-container--disabled={disabled}
    style:width={fullWidth ? "100%" : undefined}
  >
    <div
      class:bx--slider-text-input-wrapper={true}
      class:bx--slider-text-input-wrapper--lower={true}
      class:bx--slider-text-input-wrapper--hidden={hideTextInput}
    >
      <input
        bind:this={lowerInputRef}
        use:reflectDefaultValue={value}
        type={hideTextInput ? "hidden" : inputType}
        id={lowerInputId}
        {name}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--slider-text-input--lower={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={showInvalid}
        class:bx--slider-text-input--warn={showWarn}
        {value}
        aria-label={ariaLabelInput}
        {disabled}
        {readonly}
        {required}
        {min}
        max={lowerMax}
        {step}
        on:change={(event) => {
          if (readonly) return;
          const target = /** @type {HTMLInputElement} */ (event.currentTarget);
          let next = Number(target.value);
          if (Number.isNaN(next)) return;
          if (next > valueUpper - minGap) next = valueUpper - minGap;
          if (next < min) next = min;
          value = next;
          dispatch("change", { value, valueUpper });
        }}
        data-invalid={showInvalid || null}
        data-warn={showWarn || null}
        aria-invalid={showInvalid || null}
        aria-describedby={resolveStatusDescribedBy({
          showInvalid,
          showWarn,
          helperText,
          errorId,
          warnId,
          helperId,
        })}
        on:focus={handleLowerInputFocus}
        on:blur={handleLowerInputBlur}
      >
      {#if showInvalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
    </div>
    <span class:bx--slider__range-label={true}
      >{formatRangeLabel(minLabel, min)}</span
    >
    <div
      bind:this={ref}
      class:bx--slider={true}
      class:bx--slider--disabled={disabled}
      class:bx--slider--readonly={readonly}
      class:bx--slider--with-marks={resolvedMarks.length > 0}
      class:bx--slider--with-mark-labels={hasMarkLabels}
      class:bx--slider--vertical={orientation === "vertical"}
      style:max-width={fullWidth ? "none" : undefined}
      on:mousedown={startInteraction}
      on:touchstart={startInteraction}
    >
      <div
        class:bx--slider__thumb-wrapper={true}
        class:bx--slider__thumb-wrapper--lower={true}
        style:inset-inline-start={orientation === "vertical"
          ? undefined
          : `${left}%`}
        style:top={orientation === "vertical" ? `${100 - left}%` : undefined}
      >
        <div
          bind:this={lowerThumbRef}
          role="slider"
          tabindex={readonly || disabled ? undefined : 0}
          class:bx--slider__thumb={true}
          class:bx--slider__thumb--lower={true}
          aria-valuemax={lowerMax}
          aria-valuemin={min}
          aria-valuenow={value}
          aria-valuetext={getValueText(value)}
          aria-label={ariaLabelInput}
          aria-orientation={orientation}
          aria-describedby={joinDescribedBy(
            readonly ? readonlyId : null,
            resolveStatusDescribedBy({
              showInvalid,
              showWarn,
              helperText,
              errorId,
              warnId,
              helperId,
            }),
          )}
          aria-invalid={showInvalid || undefined}
          aria-readonly={readonly || undefined}
          on:focus={() => (activeHandle = "lower")}
          on:keydown={handleKeydown}
          {id}
        >
          <svg
            class:bx--slider__thumb-icon={true}
            class:bx--slider__thumb-icon--lower={true}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M15.08 6.46H16v11.08h-.92zM4.46 17.54c-.25 0-.46-.21-.46-.46V6.92a.465.465 0 0 1 .69-.4l8.77 5.08a.46.46 0 0 1 0 .8l-8.77 5.08c-.07.04-.15.06-.23.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
          </svg>
          <svg
            class:bx--slider__thumb-icon={true}
            class:bx--slider__thumb-icon--lower={true}
            class:bx--slider__thumb-icon--focus={true}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M15.08 6.46H16v11.08h-.92zM4.46 17.54c-.25 0-.46-.21-.46-.46V6.92a.465.465 0 0 1 .69-.4l8.77 5.08a.46.46 0 0 1 0 .8l-8.77 5.08c-.07.04-.15.06-.23.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
            <path d="M15.08 0H16v6.46h-.92z" />
            <path d="M0 0h.92v24H0zM15.08 0H16v24h-.92z" />
            <path d="M0 .92V0h16v.92zM0 24v-.92h16V24z" />
          </svg>
        </div>
      </div>
      <div
        class:bx--slider__thumb-wrapper={true}
        class:bx--slider__thumb-wrapper--upper={true}
        style:inset-inline-start={orientation === "vertical"
          ? undefined
          : `${leftUpper}%`}
        style:top={orientation === "vertical"
          ? `${100 - leftUpper}%`
          : undefined}
      >
        <div
          bind:this={upperThumbRef}
          role="slider"
          tabindex={readonly || disabled ? undefined : 0}
          class:bx--slider__thumb={true}
          class:bx--slider__thumb--upper={true}
          aria-valuemax={max}
          aria-valuemin={upperMin}
          aria-valuenow={valueUpper}
          aria-valuetext={getValueText(valueUpper)}
          aria-label={ariaLabelInputUpper}
          aria-orientation={orientation}
          aria-describedby={joinDescribedBy(
            readonly ? readonlyId : null,
            resolveStatusDescribedBy({
              showInvalid,
              showWarn,
              helperText,
              errorId,
              warnId,
              helperId,
            }),
          )}
          aria-invalid={showInvalid || undefined}
          aria-readonly={readonly || undefined}
          on:focus={() => (activeHandle = "upper")}
          on:keydown={handleKeydown}
        >
          <svg
            class:bx--slider__thumb-icon={true}
            class:bx--slider__thumb-icon--upper={true}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M0 6.46h.92v11.08H0zM11.54 6.46c.25 0 .46.21.46.46v10.15a.465.465 0 0 1-.69.4L2.54 12.4a.46.46 0 0 1 0-.8l8.77-5.08c.07-.04.15-.06.23-.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
          </svg>
          <svg
            class:bx--slider__thumb-icon={true}
            class:bx--slider__thumb-icon--upper={true}
            class:bx--slider__thumb-icon--focus={true}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M0 6.46h.92v11.08H0zM11.54 6.46c.25 0 .46.21.46.46v10.15a.465.465 0 0 1-.69.4L2.54 12.4a.46.46 0 0 1 0-.8l8.77-5.08c.07-.04.15-.06.23-.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
            <path d="M.92 24H0v-6.46h.92z" />
            <path d="M16 24h-.92V0H16zM.92 24H0V0h.92z" />
            <path d="M16 23.08V24H0v-.92zM16 0v.92H0V0z" />
          </svg>
        </div>
      </div>
      <div bind:this={trackRef} class:bx--slider__track={true}></div>
      <div
        class:bx--slider__filled-track={true}
        style:transform={orientation === "vertical"
          ? `translate(-50%, ${-left}%) scaleY(${(leftUpper - left) / 100})`
          : `translate(${left}%, -50%) scaleX(${(leftUpper - left) / 100})`}
      ></div>
      {#if resolvedMarks.length > 0}
        <div class:bx--slider__marks={true} aria-hidden="true">
          {#each resolvedMarks as mark (mark.value)}
            {@const percent =
              range === 0 ? 0 : ((mark.value - min) / range) * 100}
            <span
              class:bx--slider__mark={true}
              style:left={orientation === "vertical" ? undefined : `${percent}%`}
              style:top={orientation === "vertical"
                ? `${100 - percent}%`
                : undefined}
            >
              {#if mark.label != null && mark.label !== ""}
                <span class:bx--slider__mark-label={true}>{mark.label}</span>
              {/if}
            </span>
          {/each}
        </div>
      {/if}
    </div>
    <span class:bx--slider__range-label={true}
      >{formatRangeLabel(maxLabel, max)}</span
    >
    <div
      class:bx--slider-text-input-wrapper={true}
      class:bx--slider-text-input-wrapper--upper={true}
      class:bx--slider-text-input-wrapper--hidden={hideTextInput}
    >
      <input
        bind:this={upperInputRef}
        use:reflectDefaultValue={valueUpper}
        type={hideTextInput ? "hidden" : inputType}
        id={upperInputId}
        name={nameUpper}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--slider-text-input--upper={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={showInvalid}
        class:bx--slider-text-input--warn={showWarn}
        value={valueUpper}
        aria-label={ariaLabelInputUpper}
        {disabled}
        {readonly}
        {required}
        min={upperMin}
        {max}
        {step}
        on:change={(event) => {
          if (readonly) return;
          const target = /** @type {HTMLInputElement} */ (event.currentTarget);
          let next = Number(target.value);
          if (Number.isNaN(next)) return;
          if (next < value + minGap) next = value + minGap;
          if (next > max) next = max;
          valueUpper = next;
          dispatch("change", { value, valueUpper });
        }}
        data-invalid={showInvalid || null}
        data-warn={showWarn || null}
        aria-invalid={showInvalid || null}
        aria-describedby={resolveStatusDescribedBy({
          showInvalid,
          showWarn,
          helperText,
          errorId,
          warnId,
          helperId,
        })}
        on:focus={handleUpperInputFocus}
        on:blur={handleUpperInputBlur}
      >
      {#if showInvalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
    </div>
  </div>
  {#if showInvalid}
    <div
      id={errorId}
      class:bx--slider__validation-msg={true}
      class:bx--slider__validation-msg--invalid={true}
      class:bx--form-requirement={true}
    >
      {invalidText}
    </div>
  {/if}
  {#if showWarn}
    <div
      id={warnId}
      class:bx--slider__validation-msg={true}
      class:bx--form-requirement={true}
    >
      {warnText}
    </div>
  {/if}
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if readonly}
    <span id={readonlyId} class:bx--visually-hidden={true}>{readonlyText}</span>
  {/if}
</div>
