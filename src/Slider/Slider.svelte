<script>
  /**
   * @event {number} change
   * @event {number} input
   */

  /**
   * Specify the value of the slider.
   * @bindable writable
   */
  export let value = 0;

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

  /** Set to `true` to hide the text input */
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
   * <Slider>
   *   <span slot="labelChildren">Custom Label</span>
   * </Slider>
   * ```
   */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set a name for the slider element */
  export let name = "";

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const dispatch = createEventDispatcher();

  let trackRef = null;
  let dragging = false;
  let holding = false;
  let currentEvent = null;

  function startInteraction(e) {
    if (disabled || readonly) return;
    currentEvent = e;
    holding = true;
    dragging = true;
  }

  function stopHolding() {
    holding = false;
    dragging = false;
    currentEvent = null;
  }

  function move(e) {
    if (holding) {
      currentEvent = e;
      dragging = true;
    }
  }

  function calcValue(e) {
    if (disabled || readonly || !e) return;

    const offsetX = e.touches ? e.touches[0].clientX : e.clientX;
    const { left, width } = trackRef.getBoundingClientRect();
    let nextValue =
      min +
      Math.round(((max - min) * ((offsetX - left) / width)) / step) * step;

    if (nextValue <= min) {
      nextValue = min;
    } else if (nextValue >= max) {
      nextValue = max;
    }

    value = nextValue;
    dispatch("input", value);
  }

  $: labelId = `label-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: inputId = `input-${id}`;
  // Invalid/warn states are suppressed when the slider is disabled or read-only.
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: range = max - min;
  $: left = ((value - min) / range) * 100;
  $: {
    if (value <= min) {
      value = min;
    } else if (value >= max) {
      value = max;
    }

    if (dragging && currentEvent) {
      calcValue(currentEvent);
      dragging = false;
    }

    if (!holding && !disabled && !readonly) {
      dispatch("change", value);
    }
  }
</script>

<svelte:window
  on:mousemove|passive={move}
  on:touchmove|passive={move}
  on:mouseup={stopHolding}
  on:touchend={stopHolding}
  on:touchcancel={stopHolding}
/>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <label
    for={inputId}
    id={labelId}
    class:bx--label={true}
    class:bx--label--disabled={disabled}
    class:bx--visually-hidden={hideLabel}
  >
    <slot name="labelChildren"> {labelText} </slot>
  </label>
  <div
    class:bx--slider-container={true}
    class:bx--slider-container--readonly={readonly}
    style:width={fullWidth && "100%"}
  >
    <span class:bx--slider__range-label={true}>{minLabel ?? min}</span>
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
        role="slider"
        tabindex={readonly || disabled ? undefined : 0}
        class:bx--slider__thumb={true}
        style:left="{left}%"
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        aria-labelledby={labelId}
        aria-describedby={showInvalid
          ? errorId
          : showWarn
            ? warnId
            : undefined}
        aria-invalid={showInvalid || undefined}
        {id}
        on:keydown={({ shiftKey, key }) => {
          if (disabled || readonly) return;
          const keys = {
            ArrowDown: -1,
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: 1,
          };
          if (keys[key]) {
            const delta =
              step * (shiftKey ? range / step / stepMultiplier : 1) * keys[key];
            value = Math.round((value + delta) / step) * step;
            dispatch("input", value);
          }
        }}
      ></div>
      <div bind:this={trackRef} class:bx--slider__track={true}></div>
      <div
        class:bx--slider__filled-track={true}
        style:transform="translate(0, -50%) scaleX({left / 100})"
      ></div>
    </div>
    <span class:bx--slider__range-label={true}>{maxLabel ?? max}</span>
    <div class:bx--slider-text-input-wrapper={true}>
      {#if showInvalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
      <input
        type={hideTextInput ? "hidden" : inputType}
        id={inputId}
        {name}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={showInvalid}
        class:bx--slider-text-input--warn={showWarn}
        {value}
        aria-labelledby={$$props["aria-label"] ? undefined : labelId}
        aria-label={$$props["aria-label"] ?? "Slider number input"}
        {disabled}
        {readonly}
        {required}
        {min}
        {max}
        {step}
        on:change={({ target }) => {
          if (!readonly) {
            value = Number(target.value);
          }
        }}
        data-invalid={showInvalid || null}
        data-warn={showWarn || null}
        aria-invalid={showInvalid || null}
        aria-describedby={showInvalid
          ? errorId
          : showWarn
            ? warnId
            : undefined}
      >
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
</div>
