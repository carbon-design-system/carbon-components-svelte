<script>
  /**
   * @event {{ value: number; valueUpper: number }} change
   * @event {{ value: number; valueUpper: number }} input
   */

  /**
   * Specify the lower bound value of the slider.
   * @bindable writable
   */
  export let value = 0;

  /**
   * Specify the upper bound value of the slider.
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

  /** Set the step value */
  export let step = 1;

  /** Set the step multiplier value */
  export let stepMultiplier = 4;

  /** Set to `true` to require a value */
  export let required = false;

  /** Specify the input type */
  export let inputType = "number";

  /** Set to `true` to disable the slider */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to hide the text inputs */
  export let hideTextInput = false;

  /**
   * Set to `true` for the slider to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  /** Set an id for the slider div element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

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

  import { createEventDispatcher } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { dismiss } from "../utils/dismiss.js";

  /** @typedef {{ value: number; valueUpper: number }} RangeSliderChangeDetail */
  /** @typedef {"lower" | "upper"} ActiveHandle */
  /** @typedef {MouseEvent | TouchEvent} PointerLikeEvent */

  /** @type {(type: "change" | "input", detail: RangeSliderChangeDetail) => void} */
  const dispatch = createEventDispatcher();

  /** @type {HTMLDivElement | null} */
  let trackRef = null;
  /** @type {HTMLDivElement | null} */
  let lowerThumbRef = null;
  /** @type {HTMLDivElement | null} */
  let upperThumbRef = null;
  /** @type {ActiveHandle} */
  let activeHandle = "lower";
  let dragging = false;
  let holding = false;
  /** @type {PointerLikeEvent | null} */
  let currentEvent = null;

  /** @type {(e: PointerLikeEvent) => number | null} */
  function getClientX(event) {
    if ("touches" in event) return event.touches[0]?.clientX ?? null;
    return event.clientX;
  }

  /** @type {(e: PointerLikeEvent) => ActiveHandle} */
  function pickHandle(event) {
    if (event.target === lowerThumbRef) return "lower";
    if (event.target === upperThumbRef) return "upper";
    const clientX = getClientX(event);
    if (clientX == null) return activeHandle;
    const lowerRect = lowerThumbRef?.getBoundingClientRect();
    const upperRect = upperThumbRef?.getBoundingClientRect();
    const dLower = lowerRect
      ? Math.abs(lowerRect.left + lowerRect.width / 2 - clientX)
      : Number.POSITIVE_INFINITY;
    const dUpper = upperRect
      ? Math.abs(upperRect.left + upperRect.width / 2 - clientX)
      : Number.POSITIVE_INFINITY;
    return dLower <= dUpper ? "lower" : "upper";
  }

  /** @type {(e: MouseEvent | TouchEvent) => void} */
  function startInteraction(event) {
    if (disabled || readonly) return;
    activeHandle = pickHandle(event);
    if (activeHandle === "lower") {
      lowerThumbRef?.focus({ preventScroll: true });
    } else {
      upperThumbRef?.focus({ preventScroll: true });
    }
    currentEvent = event;
    holding = true;
    dragging = true;
  }

  /** @type {() => void} */
  function stopHolding() {
    holding = false;
    dragging = false;
    currentEvent = null;
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

    const offsetX = getClientX(event);
    if (offsetX == null) return;
    const { left, width } = trackRef.getBoundingClientRect();
    let nextValue =
      min +
      Math.round(((max - min) * ((offsetX - left) / width)) / step) * step;

    if (nextValue <= min) {
      nextValue = min;
    } else if (nextValue >= max) {
      nextValue = max;
    }

    if (activeHandle === "lower") {
      if (nextValue > valueUpper) nextValue = valueUpper;
      value = nextValue;
    } else {
      if (nextValue < value) nextValue = value;
      valueUpper = nextValue;
    }
    dispatch("input", { value, valueUpper });
  }

  /** @type {(e: KeyboardEvent) => void} */
  function onKeyDown(event) {
    if (disabled || readonly) return;
    /** @type {Record<string, number>} */
    const keys = {
      ArrowDown: -1,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: 1,
    };
    const dir = keys[event.key];
    if (!dir) return;
    const range = max - min;
    const delta =
      step * (event.shiftKey ? range / step / stepMultiplier : 1) * dir;
    if (activeHandle === "lower") {
      let next = Math.round((value + delta) / step) * step;
      if (next < min) next = min;
      if (next > valueUpper) next = valueUpper;
      value = next;
    } else {
      let next = Math.round((valueUpper + delta) / step) * step;
      if (next > max) next = max;
      if (next < value) next = value;
      valueUpper = next;
    }
    dispatch("input", { value, valueUpper });
  }

  $: labelId = `label-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: lowerInputId = `lower-input-${id}`;
  $: upperInputId = `upper-input-${id}`;
  $: range = max - min;
  $: left = range === 0 ? 0 : ((value - min) / range) * 100;
  $: leftUpper = range === 0 ? 0 : ((valueUpper - min) / range) * 100;
  $: {
    if (value < min) value = min;
    if (value > max) value = max;
    if (valueUpper < min) valueUpper = min;
    if (valueUpper > max) valueUpper = max;
    if (value > valueUpper) value = valueUpper;

    if (dragging && currentEvent) {
      calcValue(currentEvent);
      dragging = false;
    }

    if (!holding && !disabled && !readonly) {
      dispatch("change", { value, valueUpper });
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
        type={hideTextInput ? "hidden" : inputType}
        id={lowerInputId}
        {name}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--slider-text-input--lower={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={invalid}
        class:bx--slider-text-input--warn={warn && !invalid}
        {value}
        aria-label={ariaLabelInput}
        {disabled}
        {readonly}
        {required}
        {min}
        max={valueUpper}
        {step}
        on:change={(event) => {
          if (readonly) return;
          const target = /** @type {HTMLInputElement} */ (event.currentTarget);
          let next = Number(target.value);
          if (Number.isNaN(next)) return;
          if (next < min) next = min;
          if (next > valueUpper) next = valueUpper;
          value = next;
        }}
        data-invalid={invalid || null}
        data-warn={(warn && !invalid) || null}
        aria-invalid={invalid || null}
        aria-describedby={invalid ? errorId : warn ? warnId : undefined}
      >
      {#if invalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if warn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
    </div>
    <span class:bx--slider__range-label={true}>{minLabel || min}</span>
    <div
      bind:this={ref}
      class:bx--slider={true}
      class:bx--slider--disabled={disabled}
      class:bx--slider--readonly={readonly}
      style:max-width={fullWidth ? "none" : undefined}
      on:mousedown={startInteraction}
      on:touchstart={startInteraction}
    >
      <div
        class:bx--slider__thumb-wrapper={true}
        class:bx--slider__thumb-wrapper--lower={true}
        style:inset-inline-start="{left}%"
      >
        <div
          bind:this={lowerThumbRef}
          role="slider"
          tabindex={readonly || disabled ? undefined : 0}
          class:bx--slider__thumb={true}
          class:bx--slider__thumb--lower={true}
          aria-valuemax={valueUpper}
          aria-valuemin={min}
          aria-valuenow={value}
          aria-label={ariaLabelInput}
          aria-describedby={invalid ? errorId : warn ? warnId : undefined}
          aria-invalid={invalid || undefined}
          on:focus={() => (activeHandle = "lower")}
          on:keydown={onKeyDown}
          {id}
        >
          <svg
            class="bx--slider__thumb-icon bx--slider__thumb-icon--lower"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M15.08 6.46H16v11.08h-.92zM4.46 17.54c-.25 0-.46-.21-.46-.46V6.92a.465.465 0 0 1 .69-.4l8.77 5.08a.46.46 0 0 1 0 .8l-8.77 5.08c-.07.04-.15.06-.23.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
          </svg>
          <svg
            class="bx--slider__thumb-icon bx--slider__thumb-icon--lower bx--slider__thumb-icon--focus"
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
        style:inset-inline-start="{leftUpper}%"
      >
        <div
          bind:this={upperThumbRef}
          role="slider"
          tabindex={readonly || disabled ? undefined : 0}
          class:bx--slider__thumb={true}
          class:bx--slider__thumb--upper={true}
          aria-valuemax={max}
          aria-valuemin={value}
          aria-valuenow={valueUpper}
          aria-label={ariaLabelInputUpper}
          aria-describedby={invalid ? errorId : warn ? warnId : undefined}
          aria-invalid={invalid || undefined}
          on:focus={() => (activeHandle = "upper")}
          on:keydown={onKeyDown}
        >
          <svg
            class="bx--slider__thumb-icon bx--slider__thumb-icon--upper"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 24"
          >
            <path
              d="M0 6.46h.92v11.08H0zM11.54 6.46c.25 0 .46.21.46.46v10.15a.465.465 0 0 1-.69.4L2.54 12.4a.46.46 0 0 1 0-.8l8.77-5.08c.07-.04.15-.06.23-.06Z"
            />
            <path fill="none" d="M-4 0h24v24H-4z" />
          </svg>
          <svg
            class="bx--slider__thumb-icon bx--slider__thumb-icon--upper bx--slider__thumb-icon--focus"
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
        style:transform="translate({left}%, -50%) scaleX({(leftUpper - left) /
          100})"
      ></div>
    </div>
    <span class:bx--slider__range-label={true}>{maxLabel || max}</span>
    <div
      class:bx--slider-text-input-wrapper={true}
      class:bx--slider-text-input-wrapper--upper={true}
      class:bx--slider-text-input-wrapper--hidden={hideTextInput}
    >
      <input
        type={hideTextInput ? "hidden" : inputType}
        id={upperInputId}
        name={nameUpper}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--slider-text-input--upper={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={invalid}
        class:bx--slider-text-input--warn={warn && !invalid}
        value={valueUpper}
        aria-label={ariaLabelInputUpper}
        {disabled}
        {readonly}
        {required}
        min={value}
        {max}
        {step}
        on:change={(event) => {
          if (readonly) return;
          const target = /** @type {HTMLInputElement} */ (event.currentTarget);
          let next = Number(target.value);
          if (Number.isNaN(next)) return;
          if (next > max) next = max;
          if (next < value) next = value;
          valueUpper = next;
        }}
        data-invalid={invalid || null}
        data-warn={(warn && !invalid) || null}
        aria-invalid={invalid || null}
        aria-describedby={invalid ? errorId : warn ? warnId : undefined}
      >
      {#if invalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if warn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
    </div>
  </div>
  {#if invalid}
    <div
      id={errorId}
      class:bx--slider__validation-msg={true}
      class:bx--slider__validation-msg--invalid={true}
      class:bx--form-requirement={true}
    >
      {invalidText}
    </div>
  {/if}
  {#if warn && !invalid}
    <div
      id={warnId}
      class:bx--slider__validation-msg={true}
      class:bx--form-requirement={true}
    >
      {warnText}
    </div>
  {/if}
</div>
