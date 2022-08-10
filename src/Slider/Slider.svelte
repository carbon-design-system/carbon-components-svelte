<script>
  /** Specify the value of the slider */
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
  export let id = "ccs-" + Math.random().toString(36);

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set a name for the slider element */
  export let name = "";

  /** Obtain a reference to the HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let trackRef = null;
  let dragging = false;
  let holding = false;

  function startDragging() {
    dragging = true;
  }

  function startHolding() {
    holding = true;
  }

  function stopHolding() {
    holding = false;
    dragging = false;
  }

  function move() {
    if (holding) {
      startDragging();
    }
  }

  function calcValue(e) {
    if (disabled) return;

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
  }

  $: labelId = `label-${id}`;
  $: range = max - min;
  $: left = ((value - min) / range) * 100;
  $: {
    if (value <= min) {
      value = min;
    } else if (value >= max) {
      value = max;
    }

    if (dragging) {
      calcValue(event);
      dragging = false;
    }

    if (!holding && !disabled) {
      dispatch("change", value);
    }
  }
</script>

<svelte:window
  on:mousemove="{move}"
  on:touchmove="{move}"
  on:mouseup="{stopHolding}"
  on:touchend="{stopHolding}"
  on:touchcancel="{stopHolding}"
/>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <label
    for="{id}"
    id="{labelId}"
    class:bx--label="{true}"
    class:bx--label--disabled="{disabled}"
  >
    <slot name="labelText">
      {labelText}
    </slot>
  </label>
  <div
    class:bx--slider-container="{true}"
    style="{fullWidth ? 'width: 100%' : undefined}"
  >
    <span class:bx--slider__range-label="{true}">{minLabel || min}</span>
    <div
      bind:this="{ref}"
      role="presentation"
      tabindex="-1"
      class:bx--slider="{true}"
      class:bx--slider--disabled="{disabled}"
      style="{fullWidth ? 'max-width: none' : undefined}"
      on:mousedown="{startDragging}"
      on:mousedown="{startHolding}"
      on:touchstart="{startHolding}"
      on:keydown="{({ shiftKey, key }) => {
        const keys = {
          ArrowDown: -1,
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: 1,
        };
        if (keys[key]) {
          value +=
            step * (shiftKey ? range / step / stepMultiplier : 1) * keys[key];
        }
      }}"
    >
      <div
        role="slider"
        tabindex="0"
        class:bx--slider__thumb="{true}"
        style="left: {left}%"
        aria-valuemax="{max}"
        aria-valuemin="{min}"
        aria-valuenow="{value}"
        aria-labelledby="{labelId}"
        id="{id}"
      ></div>
      <div bind:this="{trackRef}" class:bx--slider__track="{true}"></div>
      <div
        class:bx--slider__filled-track="{true}"
        style="transform: translate(0, -50%) scaleX({left / 100})"
      ></div>
      <input
        type="hidden"
        class:bx--slider__input="{true}"
        name="{name}"
        value="{value}"
        required="{required}"
        min="{min}"
        max="{max}"
        step="{step}"
      />
    </div>
    <span class:bx--slider__range-label="{true}">{maxLabel || max}</span>
    <input
      type="{hideTextInput ? 'hidden' : inputType}"
      style="{hideTextInput ? 'display: none' : undefined}"
      id="input-{id}"
      name="{name}"
      class:bx--text-input="{true}"
      class:bx--slider-text-input="{true}"
      class:bx--text-input--light="{light}"
      class:bx--text-input--invalid="{invalid}"
      value="{value}"
      aria-labelledby="{$$props['aria-label'] ? undefined : labelId}"
      aria-label="{$$props['aria-label'] || 'Slider number input'}"
      disabled="{disabled}"
      required="{required}"
      min="{min}"
      max="{max}"
      step="{step}"
      on:change="{({ target }) => {
        value = Number(target.value);
      }}"
      data-invalid="{invalid || null}"
      aria-invalid="{invalid || null}"
    />
  </div>
</div>
